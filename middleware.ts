import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const isAdminRoute = url.pathname.startsWith("/admin");
  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  const isTranscriptionRoute = url.pathname.startsWith("/transcription");
  const isSoapRoute = url.pathname.startsWith("/soap");
  const isProtectedRoute = isAdminRoute || isDashboardRoute || isTranscriptionRoute || isSoapRoute;

  // Check for session cookie
  const hasSession = req.cookies.has("__session");
  const role = req.cookies.get("role")?.value;

  // Admin route check
  if (isAdminRoute) {
    // Check if user has any admin role
    const hasAdminAccess = role === "system-admin" || role === "nurse-admin";
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Protected route check
  if (isProtectedRoute && !hasSession) {
    // Add current path as redirectPath query param to redirect back after login
    const loginUrl = new URL("/auth/login", req.url);
    // Only add redirect for meaningful paths (not the login page itself)
    if (url.pathname !== "/") {
      loginUrl.searchParams.set("redirectPath", url.pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/transcription/:path*", "/soap/:path*"],
};