import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const issuer = process.env.SMART_ISSUER
  const clientId = process.env.NEXT_PUBLIC_SMART_CLIENT_ID
  const scopes = process.env.SMART_SCOPES
  const redirectPath = process.env.SMART_REDIRECT_PATH || '/api/smart/callback'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin

  if (!issuer || !clientId || !scopes) {
    return NextResponse.json({ error: 'SMART config missing' }, { status: 500 })
  }

  const redirectUri = new URL(redirectPath, baseUrl).toString()
  const aud = process.env.SMART_FHIR_BASE || ''
  const state = crypto.randomUUID()

  const url = `${issuer.replace(/\/$/, '')}/authorize?response_type=code&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
    scopes
  )}&state=${encodeURIComponent(state)}&aud=${encodeURIComponent(aud)}`

  // Persist state in cookie for CSRF protection during callback
  const res = NextResponse.redirect(url)
  res.cookies.set('smart_state', state, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60,
  })
  return res
}
