import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

export const runtime = "nodejs"; // ✅ force Node.js runtime

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : null

    if (!token) {
      return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const callerUid = decoded.uid

    // Check caller is admin via Firestore profile
    const callerRef = adminDb.collection('profiles').doc(callerUid)
    const callerSnap = await callerRef.get()
    const callerRole = callerSnap.exists ? (callerSnap.data() as any)?.role : undefined
    if (callerRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const targetUid = body?.uid as string | undefined
    if (!targetUid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 })
    }

    // Set custom claim and update profile role
    await adminAuth.setCustomUserClaims(targetUid, { role: 'admin' })
    await adminDb.collection('profiles').doc(targetUid).set({ role: 'admin' }, { merge: true })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('promote admin error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
