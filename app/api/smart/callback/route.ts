import { cookies } from "next/headers";
import { NextRequest, NextResponse } from 'next/server'
import { exchangeEpicCodeForToken } from '@/lib/epicAuth'
import { mockExchangeEpicCodeForToken } from '@/lib/mockEpicAuth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code') || ''
  const returnedState = searchParams.get('state') || ''
  const debug = searchParams.get('debug') === '1'
  const useMock = searchParams.get('mock') === 'true'

  // Handle Epic error responses (e.g., invalid credentials, lockout)
  const epicError = searchParams.get('error') || ''
  const epicErrorDesc = searchParams.get('error_description') || ''
  if (epicError || !code) {
    console.error('SMART callback error from Epic:', { error: epicError, description: epicErrorDesc })
    const errorParam = epicErrorDesc
      ? encodeURIComponent(epicErrorDesc.slice(0, 200))
      : 'auth_failed'
    const url = new URL(`/ehr-sandbox?smart=error&reason=${errorParam}`, req.nextUrl.origin)
    return NextResponse.redirect(url)
  }
  
  // ✅ Next 14+ requires await for cookies()
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('smart_state')?.value || ''
  const codeVerifier = cookieStore.get('smart_code_verifier')?.value || ''
  const redirectUriUsed = cookieStore.get('smart_redirect_uri')?.value

  // Skip state validation for mock mode
  if (!useMock && (!expectedState || expectedState !== returnedState)) {
    const url = new URL('/?smart=state_mismatch', req.nextUrl.origin)
    return NextResponse.redirect(url)
  }

  try {
    // Use mock implementation if specified or if we're in testing/development
    const token = useMock 
      ? await mockExchangeEpicCodeForToken(code)
      : await exchangeEpicCodeForToken(code, {
          codeVerifier,
          redirectUriOverride: redirectUriUsed || undefined,
        })
        
    // Prefer the fhir base captured at launch time; fallback to env
    const cookieFhirBase = cookieStore.get('smart_fhir_base')?.value || ''
    const fhirBase = cookieFhirBase || process.env.SMART_FHIR_BASE || ''

    if (debug) {
      return NextResponse.json({ 
        ok: true, 
        token, 
        fhirBase, 
        usedRedirectUri: redirectUriUsed,
        mock: useMock 
      })
    }

    const res = NextResponse.redirect(new URL('/ehr-sandbox?smart=connected', req.nextUrl.origin))
    const cookieOpts = {
      path: '/',
      sameSite: 'lax' as const,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    }
    
    // Set access token cookie
    res.cookies.set('smart_access_token', token.access_token || '', { 
      ...cookieOpts, 
      maxAge: token.expires_in || 3600 
    })
    
    // Set refresh token cookie if available
    if (token.refresh_token) {
      res.cookies.set('smart_refresh_token', token.refresh_token, {
        ...cookieOpts,
        maxAge: 60 * 60 * 24 * 30, // ~30 days
      })
    }
    
    // Set FHIR base cookie
    res.cookies.set('smart_fhir_base', fhirBase, { 
      ...cookieOpts, 
      maxAge: token.expires_in || 3600 
    })

    // Store EHR Launch context (patient, practitioner, encounter) if present
    const contextMaxAge = token.expires_in || 3600
    if (token.patient) {
      res.cookies.set('smart_patient', token.patient, { ...cookieOpts, maxAge: contextMaxAge })
    }
    if ((token as any).practitioner) {
      res.cookies.set('smart_practitioner', (token as any).practitioner, { ...cookieOpts, maxAge: contextMaxAge })
    }
    if (token.encounter) {
      res.cookies.set('smart_encounter', token.encounter, { ...cookieOpts, maxAge: contextMaxAge })
    }
    if ((token as any).fhirUser) {
      res.cookies.set('smart_fhir_user', (token as any).fhirUser, { ...cookieOpts, maxAge: contextMaxAge })
    }
    
    // Clear temporary cookies
    res.cookies.set('smart_state', '', { ...cookieOpts, maxAge: 0 })
    res.cookies.set('smart_code_verifier', '', { ...cookieOpts, maxAge: 0 })
    res.cookies.set('smart_redirect_uri', '', { ...cookieOpts, maxAge: 0 })
    
    return res
  } catch (err: any) {
    console.error('Token exchange error:', err?.message)
    
    if (debug) {
      return NextResponse.json(
        { ok: false, error: err?.message || 'token_exchange_failed', usedRedirectUri: redirectUriUsed },
        { status: 500 }
      )
    }
    const url = new URL('/?smart=token_error', req.nextUrl.origin)
    return NextResponse.redirect(url)
  }
}
