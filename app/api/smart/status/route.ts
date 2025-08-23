import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const snap = await db.collection('smart').doc('config').get()
    if (!snap.exists) {
      return NextResponse.json({ connected: false, message: 'No SMART config' })
    }
    const data = snap.data() as any
    const token = data?.access_token || data?.token
    if (!token) {
      return NextResponse.json({ connected: false, message: 'No token' })
    }
    // Optionally, we could attempt a lightweight FHIR ping here with the token.
    return NextResponse.json({ connected: true })
  } catch (err: any) {
    console.error('SMART status error', err)
    return NextResponse.json({ connected: false, error: err?.message || 'Internal error' }, { status: 500 })
  }
}
