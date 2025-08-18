import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.nextUrl.origin))
  const cookieOpts = {
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }
  // Clear cookies by setting empty values and maxAge in the past
  res.cookies.set('smart_access_token', '', { ...cookieOpts, maxAge: 0 })
  res.cookies.set('smart_fhir_base', '', { ...cookieOpts, maxAge: 0 })
  res.cookies.set('smart_state', '', { ...cookieOpts, maxAge: 0 })
  res.cookies.set('smart_code_verifier', '', { ...cookieOpts, maxAge: 0 })
  return res
}
