export type EpicTokenResponse = {
  access_token: string
  token_type?: string
  expires_in?: number
  scope?: string
  patient?: string
  encounter?: string
  id_token?: string
  refresh_token?: string
}

export async function exchangeEpicCodeForToken(
  code: string,
  opts?: { codeVerifier?: string; redirectUriOverride?: string }
): Promise<EpicTokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_SMART_CLIENT_ID
  const clientSecret = process.env.SMART_CLIENT_SECRET
  const redirectPath = process.env.SMART_REDIRECT_PATH || '/api/smart/callback'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  // Ensure redirectPath is properly handled as either relative or absolute
  let computedRedirect: string
  if (redirectPath.startsWith('http://') || redirectPath.startsWith('https://')) {
    // Already an absolute URL
    computedRedirect = redirectPath
  } else {
    // Relative path - construct full URL
    try {
      computedRedirect = new URL(redirectPath, baseUrl).toString()
    } catch (e) {
      // Fallback if URL construction fails
      computedRedirect = `${baseUrl.replace(/\/$/, '')}${redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`}`
    }
  }
  
  const redirectUri = opts?.redirectUriOverride || computedRedirect

  // Use explicit token URL from env
  const tokenUrl = process.env.SMART_TOKEN_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token'

  if (!clientId) throw new Error('NEXT_PUBLIC_SMART_CLIENT_ID missing')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
  })
  if (opts?.codeVerifier) body.set('code_verifier', opts.codeVerifier)

  // Include client_secret in POST body when available
  // Epic sandbox accepts secret in body for both public and confidential clients
  if (clientSecret) {
    body.set('client_secret', clientSecret)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  console.log('🎯 Token exchange request:', {
    tokenUrl,
    redirectUri,
    hasSecret: !!clientSecret,
    hasCodeVerifier: !!opts?.codeVerifier,
    clientIdPrefix: clientId.slice(0, 8),
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body,
    cache: 'no-store',
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Epic token exchange failed: ${res.status} ${msg}`)
  }

  return (await res.json()) as EpicTokenResponse
}

// New function to exchange refresh token for access token
export async function exchangeRefreshTokenForAccessToken(
  refreshToken: string
): Promise<EpicTokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_SMART_CLIENT_ID
  const clientSecret = process.env.SMART_CLIENT_SECRET
  const tokenUrl = process.env.SMART_TOKEN_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token'

  if (!clientId) throw new Error('NEXT_PUBLIC_SMART_CLIENT_ID missing')
  if (!clientSecret) throw new Error('SMART_CLIENT_SECRET missing')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body,
    cache: 'no-store',
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Refresh token exchange failed: ${res.status} ${msg}`)
  }

  return (await res.json()) as EpicTokenResponse
}
