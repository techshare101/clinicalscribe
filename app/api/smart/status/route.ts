import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeRefreshTokenForAccessToken } from '@/lib/epicAuth';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  console.log('🔍 SMART Status Route: GET request received');
  try {
    // ✅ Next 14+ requires await for cookies()
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("smart_access_token")?.value;
    const refreshToken = cookieStore.get("smart_refresh_token")?.value;
    const fhirBase = cookieStore.get("smart_fhir_base")?.value;

    // If we have an access token and fhir base, we're connected
    if (accessToken && fhirBase) {
      // Try to decode the token to get expiry (if it's a JWT)
      let expiresIn = 3600; // Default 1 hour
      try {
        // Simple JWT decode without verification (just to get exp claim)
        const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
        if (payload.exp) {
          const expiryTime = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          expiresIn = Math.max(0, Math.floor((expiryTime - now) / 1000));
        }
      } catch (e) {
        // Not a JWT or couldn't decode, use default
      }

      return NextResponse.json({
        connected: true,
        fhirBase,
        source: 'cookies',
        expiresIn, // Time in seconds until token expires
        hasRefreshToken: !!refreshToken
      });
    }
    
    // If we have a refresh token but no access token, try to refresh
    if (refreshToken && fhirBase) {
      try {
        console.log('📊 SMART Status: Attempting to refresh token');
        const tokenData = await exchangeRefreshTokenForAccessToken(refreshToken);
        
        // If successful, update the access token cookie and return connected status
        if (tokenData.access_token) {
          // Calculate token expiry
          let expiresIn = tokenData.expires_in || 3600;
          try {
            const payload = JSON.parse(Buffer.from(tokenData.access_token.split('.')[1], 'base64').toString());
            if (payload.exp) {
              const expiryTime = payload.exp * 1000;
              const now = Date.now();
              expiresIn = Math.max(0, Math.floor((expiryTime - now) / 1000));
            }
          } catch (e) {
            // Use expires_in from response
          }

          const response = NextResponse.json({ 
            connected: true,
            fhirBase,
            source: 'refreshed',
            refreshed: true,
            expiresIn,
            hasRefreshToken: !!tokenData.refresh_token
          });
          
          // Set the new access token cookie
          response.cookies.set('smart_access_token', tokenData.access_token, {
            path: '/',
            sameSite: 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: tokenData.expires_in || 3600
          });
          
          // If we got a new refresh token, update that too
          if (tokenData.refresh_token) {
            response.cookies.set('smart_refresh_token', tokenData.refresh_token, {
              path: '/',
              sameSite: 'lax',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 30 // ~30 days
            });
          }
          
          return response;
        }
      } catch (refreshError) {
        console.warn('📊 SMART Status: Token refresh failed:', refreshError);
        // Continue with not connected response
      }
    }

    return NextResponse.json({ 
      connected: false,
      message: 'No active EHR connection'
    });
  } catch (err: any) {
    console.error("❌ SMART status route failed:", err);
    // Always return JSON, never HTML
    return NextResponse.json(
      { 
        connected: false, 
        error: err.message ?? "Unknown error",
        type: 'error'
      },
      { status: 500 }
    );
  }
}
