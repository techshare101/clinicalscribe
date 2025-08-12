export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  // Expire SMART cookies to disconnect the session
  const expired = new Date(0)
  res.cookies.set('smart_access_token', '', { path: '/', expires: expired, httpOnly: true })
  res.cookies.set('smart_fhir_base', '', { path: '/', expires: expired, httpOnly: true })
  res.cookies.set('smart_state', '', { path: '/', expires: expired, httpOnly: true })
  res.cookies.set('smart_code_verifier', '', { path: '/', expires: expired, httpOnly: true })
  return res
}
