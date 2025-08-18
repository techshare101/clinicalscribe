import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('__session')?.value
    if (!session) return NextResponse.redirect(new URL('/', req.url))

    const decoded = await adminAuth.verifySessionCookie(session, true)
    const uid = decoded.uid

    await adminDb.collection('profiles').doc(uid).set({ betaActive: true, plan: 'beta', updatedAt: Date.now() }, { merge: true })

    return NextResponse.redirect(new URL('/dashboard?upgraded=true', req.url))
  } catch (e) {
    return NextResponse.redirect(new URL('/dashboard?error=stripe', req.url))
  }
}
