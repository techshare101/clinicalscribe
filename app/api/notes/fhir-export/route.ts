import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { noteId, status, docRef, posted, remote, error } = await req.json()

    if (!noteId || !status) {
      return NextResponse.json({ error: 'noteId and status required' }, { status: 400 })
    }

    const payload = {
      fhirExport: {
        status,                           // 'none' | 'exported' | 'failed'
        updatedAt: new Date().toISOString(),
        docRef: docRef ?? null,           // keep for audit/debug
        posted: !!posted,
        remote: remote ?? null,           // { server?, resourceId?, response? }
        error: error ?? null,
      },
    }

    await setDoc(doc(db, 'soapNotes', noteId), payload as any, { merge: true })

    return NextResponse.json({ ok: true, ...payload })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Persist failed' }, { status: 500 })
  }
}
