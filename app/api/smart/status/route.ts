import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeRefreshTokenForAccessToken } from '@/lib/epicAuth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // ✅ Next 14+ requires await for cookies()
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("smart_access_token")?.value;
    const refreshToken = cookieStore.get("smart_refresh_token")?.value;
    const fhirBase = cookieStore.get("smart_fhir_base")?.value;

    // If we have an access token and fhir base, we're connected
    if (accessToken && fhirBase) {
      return NextResponse.json({
        connected: true,
        fhirBase,
        source: 'cookies'
      });
    }
    
    // If we have a refresh token but no access token, try to refresh
    if (refreshToken && fhirBase) {
      try {
        console.log('📊 SMART Status: Attempting to refresh token');
        const tokenData = await exchangeRefreshTokenForAccessToken(refreshToken);
        
        // If successful, update the access token cookie and return connected status
        if (tokenData.access_token) {
          const response = NextResponse.json({ 
            connected: true,
            fhirBase,
            source: 'refreshed',
            refreshed: true
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