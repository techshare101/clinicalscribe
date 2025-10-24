import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Helper to generate PKCE code verifier and challenge
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return { codeVerifier, codeChallenge }
}

export async function GET(req: NextRequest) {
  const authUrl = process.env.SMART_AUTH_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize'
  const clientId = process.env.NEXT_PUBLIC_SMART_CLIENT_ID
  const scopes = process.env.SMART_SCOPES
  const redirectPath = process.env.SMART_REDIRECT_PATH || '/api/smart/callback'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin

  if (!clientId || !scopes) {
    return NextResponse.json({ error: 'SMART config missing' }, { status: 500 })
  }

  // Ensure redirectPath is properly handled as either relative or absolute
  let redirectUri: string
  if (redirectPath.startsWith('http://') || redirectPath.startsWith('https://')) {
    // Already an absolute URL
    redirectUri = redirectPath
  } else {
    // Relative path - construct full URL
    try {
      redirectUri = new URL(redirectPath, baseUrl).toString()
    } catch (e) {
      // Fallback if URL construction fails
      redirectUri = `${baseUrl.replace(/\/$/, '')}${redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`}`
    }
  }
  
  const aud = process.env.SMART_FHIR_BASE || ''
  const state = crypto.randomUUID()
  
  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = generatePKCE()

  // Build authorization URL with PKCE
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state: state,
    aud: aud,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  const url = `${authUrl}?${params.toString()}`

  // Persist state and PKCE verifier in cookies for callback
  const res = NextResponse.redirect(url)
  res.cookies.set('smart_state', state, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60,
  })
  res.cookies.set('smart_code_verifier', codeVerifier, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60,
  })
  res.cookies.set('smart_redirect_uri', redirectUri, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60,
  })
  res.cookies.set('smart_fhir_base', aud, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60,
  })
  
  console.log('🚀 SMART authorize redirect:', {
    authUrl,
    redirectUri,
    scopes,
    hasPKCE: true
  })
  
  return res
}
