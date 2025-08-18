export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'

function adminCredsConfigured() {
  // At least one of these must be present for Admin SDK to work locally
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const adc = process.env.GOOGLE_APPLICATION_CREDENTIALS
  return Boolean(b64 || (projectId && clientEmail && privateKey) || adc)
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }
  if (!adminCredsConfigured()) {
    return NextResponse.json(
      {
        error:
          'Firebase Admin credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 (preferred) or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS.',
      },
      { status: 500 }
    )
  }
  try {
    const { uid } = await req.json()
    if (!uid || typeof uid !== 'string') return NextResponse.json({ error: 'uid required' }, { status: 400 })
    const customToken = await adminAuth.createCustomToken(uid)
    return NextResponse.json({ customToken })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
