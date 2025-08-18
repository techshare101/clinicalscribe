import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

function base64UrlEncode(input: Buffer | string) {
  const base64 = (input instanceof Buffer ? input : Buffer.from(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return base64
}

function deriveAuthorizeEndpoint(fhirBase: string): string {
  // Normalize
  const base = fhirBase.replace(/\/$/, '')
  try {
    const url = new URL(base)
    // Epic public sandbox: oauth endpoints are at <origin>/oauth2/*, not under the FHIR base path
    if (url.hostname.includes('fhir.epic.com')) {
      // Remove trailing "/api/FHIR/..." from the path and append "/oauth2/authorize"
      const parts = url.pathname.split('/').filter(Boolean)
      const apiIdx = parts.findIndex((p) => p.toLowerCase() === 'api')
      const origin = `${url.protocol}//${url.host}`
      const root = apiIdx > -1 ? `${origin}/${parts.slice(0, apiIdx).join('/')}` : `${origin}${url.pathname}`
      const rootClean = root.replace(/\/$/, '')
      return `${rootClean}/oauth2/authorize`
    }
  } catch {
    // ignore parse issues, fall through
  }
  // Generic SMART default
  return `${base}/auth/authorize`
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const fhirBase = searchParams.get('fhirBase')

  if (!fhirBase) {
    return NextResponse.json({ error: 'Missing fhirBase' }, { status: 400 })
  }

  const clientId = process.env.NEXT_PUBLIC_SMART_CLIENT_ID || ''
  if (!clientId) {
    return NextResponse.json({ error: 'SMART client ID not configured (NEXT_PUBLIC_SMART_CLIENT_ID)' }, { status: 400 })
  }

  // PKCE
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32))
  const codeChallenge = base64UrlEncode(crypto.createHash('sha256').update(codeVerifier).digest())
  const state = crypto.randomBytes(8).toString('hex')
  const nonce = crypto.randomBytes(16).toString('hex')

  // Redirect URI: prefer NEXT_PUBLIC_BASE_URL for stability across environments
  const redirectPath = process.env.SMART_REDIRECT_PATH || '/api/smart/callback'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
  const configuredRedirect = /^https?:\/\//i.test(redirectPath)
    ? redirectPath
    : new URL(redirectPath, baseUrl).toString()

  // Safety net: if configuredRedirect origin doesn't match current origin, rewrite to current
  const currentOrigin = new URL(baseUrl).origin
  let redirectUri = configuredRedirect
  try {
    const cfg = new URL(configuredRedirect)
    if (cfg.origin !== currentOrigin) {
      cfg.protocol = new URL(currentOrigin).protocol
      cfg.host = new URL(currentOrigin).host
      redirectUri = cfg.toString()
    }
  } catch {
    // ignore
  }

  // Choose authorize endpoint: SMART_ISSUER if provided, else derive from fhirBase
  let authorizeHref = ''
  const issuer = process.env.SMART_ISSUER?.replace(/\/$/, '')
  if (issuer) {
    authorizeHref = `${issuer}/authorize`
  } else {
    authorizeHref = deriveAuthorizeEndpoint(fhirBase)
  }

  const authorizeUrl = new URL(authorizeHref)
  const requestedScopes = (process.env.SMART_SCOPES || 'openid fhirUser offline_access patient/*.read')
    .split(/\s+/)
    .filter(Boolean)

  // If no launch param provided, drop any launch/* scopes for Standalone flow
  const launchParam = searchParams.get('launch')
  const effectiveScopes = launchParam
    ? requestedScopes
    : requestedScopes.filter((s) => !s.startsWith('launch/'))

  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('scope', effectiveScopes.join(' '))
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')
  authorizeUrl.searchParams.set('aud', fhirBase)
  if (launchParam) authorizeUrl.searchParams.set('launch', launchParam)
  if (effectiveScopes.includes('openid')) authorizeUrl.searchParams.set('nonce', nonce)

  // Optional debug mode
  if (searchParams.get('debug') === '1') {
    return NextResponse.json({
      authorizeUrl: authorizeUrl.toString(),
      authorizeHref,
      params: {
        clientId,
        redirectUri,
        scope: effectiveScopes.join(' '),
        state,
        codeChallengeMethod: 'S256',
        aud: fhirBase,
        nonce: effectiveScopes.includes('openid') ? nonce : undefined,
        launch: launchParam || undefined,
      },
      baseUrlUsed: baseUrl,
    })
  }

  const res = NextResponse.redirect(authorizeUrl.toString())
  const cookieOpts = {
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }
  res.cookies.set('smart_code_verifier', codeVerifier, cookieOpts)
  res.cookies.set('smart_fhir_base', fhirBase, cookieOpts)
  res.cookies.set('smart_state', state, cookieOpts)
  res.cookies.set('smart_redirect_uri', redirectUri, cookieOpts)
  return res
}
