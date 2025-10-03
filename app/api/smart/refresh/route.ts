import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeRefreshTokenForAccessToken } from '@/lib/epicAuth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    // Get refresh token from cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("smart_refresh_token")?.value;
    const fhirBase = cookieStore.get("smart_fhir_base")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "No refresh token available",
          code: "NO_REFRESH_TOKEN"
        },
        { status: 401 }
      );
    }

    console.log('🔄 Attempting to refresh SMART token');
    
    try {
      // Exchange refresh token for new access token
      const tokenData = await exchangeRefreshTokenForAccessToken(refreshToken);
      
      if (!tokenData.access_token) {
        throw new Error('No access token in refresh response');
      }

      // Prepare response with new token status
      const response = NextResponse.json({ 
        ok: true,
        message: "Token refreshed successfully",
        expiresIn: tokenData.expires_in || 3600,
        fhirBase
      });

      // Set cookie options
      const cookieOpts = {
        path: '/',
        sameSite: 'lax' as const,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      };

      // Update access token cookie
      response.cookies.set('smart_access_token', tokenData.access_token, {
        ...cookieOpts,
        maxAge: tokenData.expires_in || 3600
      });

      // If we got a new refresh token, update that too
      if (tokenData.refresh_token && tokenData.refresh_token !== refreshToken) {
        response.cookies.set('smart_refresh_token', tokenData.refresh_token, {
          ...cookieOpts,
          maxAge: 60 * 60 * 24 * 30 // ~30 days
        });
        console.log('🔄 Refresh token was also updated');
      }

      console.log('✅ SMART token refreshed successfully');
      return response;

    } catch (refreshError: any) {
      console.error('❌ Token refresh failed:', refreshError);
      
      // If refresh fails, clear all SMART cookies
      const response = NextResponse.json(
        { 
          ok: false, 
          error: refreshError.message || "Failed to refresh token",
          code: "REFRESH_FAILED"
        },
        { status: 401 }
      );

      // Clear SMART session cookies
      response.cookies.set('smart_access_token', '', { maxAge: 0 });
      response.cookies.set('smart_refresh_token', '', { maxAge: 0 });
      response.cookies.set('smart_fhir_base', '', { maxAge: 0 });

      return response;
    }

  } catch (err: any) {
    console.error("❌ SMART refresh route failed:", err);
    return NextResponse.json(
      { 
        ok: false, 
        error: err.message ?? "Unknown error",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing
export async function GET() {
  return NextResponse.json(
    { 
      ok: false, 
      error: "Use POST method to refresh token",
      endpoint: "/api/smart/refresh"
    },
    { status: 405 }
  );
}