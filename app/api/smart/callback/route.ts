import { NextRequest, NextResponse } from 'next/server'
import { exchangeEpicCodeForToken } from '@/lib/epicAuth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || ''
  const returnedState = req.nextUrl.searchParams.get('state') || ''
  const expectedState = req.cookies.get('smart_state')?.value || ''
  const codeVerifier = req.cookies.get('smart_code_verifier')?.value || ''
  const redirectUriUsed = req.cookies.get('smart_redirect_uri')?.value
  const debug = req.nextUrl.searchParams.get('debug') === '1'

  if (!code) {
    const url = new URL('/?smart=error', req.nextUrl.origin)
    return NextResponse.redirect(url)
  }
  if (!expectedState || expectedState !== returnedState) {
    const url = new URL('/?smart=state_mismatch', req.nextUrl.origin)
    return NextResponse.redirect(url)
  }

  try {
    const token = await exchangeEpicCodeForToken(code, {
      codeVerifier,
      redirectUriOverride: redirectUriUsed || undefined,
    })
    // Prefer the fhir base captured at launch time; fallback to env
    const cookieFhirBase = req.cookies.get('smart_fhir_base')?.value || ''
    const fhirBase = cookieFhirBase || process.env.SMART_FHIR_BASE || ''

    if (debug) {
      return NextResponse.json({ ok: true, token, fhirBase, usedRedirectUri: redirectUriUsed })
    }

    const res = NextResponse.redirect(new URL('/dashboard?smart=connected', req.nextUrl.origin))
    const cookieOpts = {
      path: '/',
      sameSite: 'lax' as const,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    }
    res.cookies.set('smart_access_token', token.access_token || '', { ...cookieOpts, maxAge: token.expires_in || 3600 })
    res.cookies.set('smart_fhir_base', fhirBase, { ...cookieOpts, maxAge: token.expires_in || 3600 })
    res.cookies.set('smart_state', '', { ...cookieOpts, maxAge: 0 })
    res.cookies.set('smart_code_verifier', '', { ...cookieOpts, maxAge: 0 })
    res.cookies.set('smart_redirect_uri', '', { ...cookieOpts, maxAge: 0 })
    return res
  } catch (err: any) {
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
