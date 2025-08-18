import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const isAdminRoute = url.pathname.startsWith("/admin");

  const role = req.cookies.get("role")?.value;

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
