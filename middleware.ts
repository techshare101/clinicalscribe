import { NextRequest, NextResponse } from "next/server";

// Test, debug and scaffolding surfaces that must never be reachable in production
const BLOCKED_IN_PRODUCTION = [
  "/test",
  "/test-auth",
  "/test-firestore",
  "/test-soap",
  "/test-connection-lifecycle",
  "/firebase-test",
  "/dev",
  "/api/debug",
  "/api/debug-bucket",
  "/api/debug-client-firebase",
  "/api/dev",
  "/api/test-auth",
  "/api/test-render",
  "/api/smart/debug-context",
];

function isBlockedInProduction(pathname: string) {
  return BLOCKED_IN_PRODUCTION.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);

  if (process.env.NODE_ENV === "production" && isBlockedInProduction(url.pathname)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const isAdminRoute = url.pathname.startsWith("/admin");
  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  const isTranscriptionRoute = url.pathname.startsWith("/transcription");
  const isSoapRoute = url.pathname.startsWith("/soap");
  const isProtectedRoute = isAdminRoute || isDashboardRoute || isTranscriptionRoute || isSoapRoute;

  // Check for session cookie
  const hasSession = req.cookies.has("__session");
  const role = req.cookies.get("role")?.value;

  // Admin route check — UX redirect only. The `role` cookie is set in the browser and can be
  // forged; the real enforcement is app/admin/layout.tsx and requireApiAdmin() on every admin API.
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
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/transcription/:path*",
    "/soap/:path*",
    "/test",
    "/test/:path*",
    "/test-auth/:path*",
    "/test-auth",
    "/test-firestore/:path*",
    "/test-firestore",
    "/test-soap/:path*",
    "/test-soap",
    "/test-connection-lifecycle/:path*",
    "/test-connection-lifecycle",
    "/firebase-test/:path*",
    "/firebase-test",
    "/dev/:path*",
    "/dev",
    "/api/debug/:path*",
    "/api/debug",
    "/api/debug-bucket/:path*",
    "/api/debug-bucket",
    "/api/debug-client-firebase/:path*",
    "/api/debug-client-firebase",
    "/api/dev/:path*",
    "/api/test-auth/:path*",
    "/api/test-auth",
    "/api/test-render/:path*",
    "/api/test-render",
    "/api/smart/debug-context",
  ],
};