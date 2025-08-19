export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }
    // Create a Firebase session cookie (up to 14 days). We'll use 7 days.
    const expiresIn = 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(expiresIn / 1000),
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create session' }, { status: 500 })
  }
}
export async function GET() {
  return NextResponse.json({ ok: true })
}


export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('__session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
