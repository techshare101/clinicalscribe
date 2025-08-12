import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  const cookies = req.cookies
  const expectedState = cookies.get('smart_state')?.value
  const codeVerifier = cookies.get('smart_code_verifier')?.value
  const fhirBase = cookies.get('smart_fhir_base')?.value

  if (!code || !state || state !== expectedState || !codeVerifier || !fhirBase) {
    return NextResponse.json({ error: 'Invalid SMART callback' }, { status: 400 })
  }

  // Determine token endpoint: Epic uses /oauth2/token; generic is /auth/token
  function deriveTokenEndpoint(base: string): string {
    const clean = base.replace(/\/$/, '')
    try {
      const url = new URL(clean)
      if (url.hostname.includes('fhir.epic.com')) {
        const parts = url.pathname.split('/').filter(Boolean)
        const apiIdx = parts.findIndex((p) => p.toLowerCase() === 'api')
        const origin = `${url.protocol}//${url.host}`
        const root = apiIdx > -1 ? `${origin}/${parts.slice(0, apiIdx).join('/')}` : `${origin}${url.pathname}`
        const rootClean = root.replace(/\/$/, '')
        return `${rootClean}/oauth2/token`
      }
    } catch {
      // fall through
    }
    return `${clean}/auth/token`
  }

  const tokenUrl = deriveTokenEndpoint(fhirBase)

  const clientId = process.env.NEXT_PUBLIC_SMART_CLIENT_ID
  const clientSecret = process.env.SMART_CLIENT_SECRET
  if (!clientId) {
    return NextResponse.json({ error: 'SMART client ID not configured (NEXT_PUBLIC_SMART_CLIENT_ID)' }, { status: 400 })
  }

  const form = new URLSearchParams()
  form.set('grant_type', 'authorization_code')
  form.set('code', code)
  form.set('redirect_uri', `${req.nextUrl.origin}/smart/callback`)
  form.set('client_id', clientId)
  form.set('code_verifier', codeVerifier)
  if (clientSecret) {
    form.set('client_secret', clientSecret)
  }

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })

  const tokenJson = await tokenRes.json().catch(() => ({}))
  if (!tokenRes.ok || !tokenJson?.access_token) {
    return NextResponse.json({ error: 'Token exchange failed', details: tokenJson }, { status: 500 })
  }

  const res = NextResponse.redirect(new URL('/', req.nextUrl.origin))
  const cookieOpts = {
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }
  res.cookies.set('smart_access_token', tokenJson.access_token, cookieOpts)
  res.cookies.set('smart_fhir_base', fhirBase, cookieOpts)
  return res
}
