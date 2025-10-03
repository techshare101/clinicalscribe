# Epic SMART on FHIR OAuth Troubleshooting Guide

## Common Issues and Solutions

### 1. "Invalid OAuth 2.0 request" Error

**Causes:**
- Redirect URI mismatch
- Missing or incorrect parameters
- Wrong OAuth endpoint URLs

**Solutions:**

1. **Check Redirect URI**
   - Must match EXACTLY what's registered in Epic
   - Check for trailing slashes, http vs https, port numbers
   ```
   ❌ http://localhost:3000/api/smart/callback/
   ✅ http://localhost:3000/api/smart/callback
   ```

2. **Verify Environment Variables**
   ```bash
   # .env.local should have:
   SMART_AUTH_URL=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize
   SMART_TOKEN_URL=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token
   SMART_FHIR_BASE=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
   ```

3. **Register Multiple Redirect URIs in Epic**
   - Local: `http://localhost:3000/api/smart/callback`
   - Production: `https://your-domain.com/api/smart/callback`

### 2. Token Exchange Fails

**Debug Steps:**

1. **Check Authorization URL**
   ```javascript
   // In /api/smart/authorize, log the full URL:
   console.log('Authorization URL:', url)
   ```

2. **Verify Required Parameters**
   - `response_type=code`
   - `client_id` (your Epic app ID)
   - `redirect_uri` (exact match)
   - `scope` (space-separated)
   - `state` (for CSRF protection)
   - `aud` (FHIR base URL)

3. **PKCE Parameters (if required)**
   - `code_challenge`
   - `code_challenge_method=S256`

### 3. Refresh Token Issues

**Common Problems:**
- Refresh token not included in response
- Refresh fails with 401

**Solutions:**

1. **Ensure `offline_access` scope**
   ```
   SMART_SCOPES="openid fhirUser offline_access patient/*.read"
   ```

2. **Store Refresh Token Properly**
   ```javascript
   // In callback:
   if (tokenData.refresh_token) {
     res.cookies.set('smart_refresh_token', tokenData.refresh_token, {
       httpOnly: true,
       secure: true,
       maxAge: 60 * 60 * 24 * 30 // 30 days
     })
   }
   ```

### 4. CORS Issues

**If seeing CORS errors:**

1. API routes should not have CORS issues (server-side)
2. If calling from client-side, use API routes as proxy

### 5. Testing the Flow

**Manual Testing:**

1. **Start Authorization**
   ```bash
   curl http://localhost:3000/api/smart/authorize
   # Should redirect to Epic login
   ```

2. **Check Status**
   ```bash
   curl http://localhost:3000/api/smart/status
   # Should return connection status
   ```

3. **Test Refresh**
   ```bash
   curl -X POST http://localhost:3000/api/smart/refresh
   # Should refresh token if available
   ```

### 6. Debug Mode

Add debug logging to track the flow:

```javascript
// In authorize route:
console.log('🚀 SMART authorize:', {
  authUrl,
  clientId: clientId.substring(0, 8) + '...',
  redirectUri,
  scopes
})

// In callback route:
console.log('🔄 SMART callback:', {
  hasCode: !!code,
  hasState: !!state,
  expectedState: cookieStore.get('smart_state')?.value?.substring(0, 8) + '...'
})

// In token exchange:
console.log('🎯 Token exchange:', {
  tokenUrl,
  redirectUri,
  grantType: 'authorization_code'
})
```

### 7. Epic-Specific Requirements

1. **Redirect URI**: Must be HTTPS in production (HTTP allowed for localhost)
2. **Scopes**: Use Epic's exact scope format (e.g., `patient/*.read` not `patient/*.*`)
3. **FHIR Version**: Ensure using `/api/FHIR/R4` not `/api/FHIR/STU3`

### 8. Quick Checklist

- [ ] Epic app registered and approved
- [ ] Client ID and Secret are correct
- [ ] Redirect URI matches exactly
- [ ] Using correct OAuth endpoints
- [ ] Including all required parameters
- [ ] PKCE enabled (if required)
- [ ] Cookies are being set/read correctly
- [ ] Using HTTPS in production

## Still Having Issues?

1. Check Epic's logs in their developer portal
2. Use browser dev tools Network tab to see exact requests/responses
3. Enable debug mode in callback: `?debug=1`
4. Check server logs for detailed error messages