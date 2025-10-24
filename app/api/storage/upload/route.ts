export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminBucket } from '@/lib/firebase-admin'

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  return m?.[1]
}

function isAllowedPath(path: string) {
  // Only allow top-level folders we expect
  return path.startsWith('pdfs/') || path.startsWith('/pdfs/')
}

async function assertOwnershipOrAdmin({
  req,
  path,
}: {
  req: NextRequest
  path: string
}) {
  const token = getBearerToken(req)
  if (!token) throw new Error('unauth')
  const decoded = await adminAuth.verifyIdToken(token)
  const uid = decoded.uid
  const role = (decoded as any).role

  const normalized = path.replace(/^\//, '')
  if (!isAllowedPath(normalized)) {
    const err: any = new Error('forbidden')
    err.status = 403
    throw err
  }

  const [top, owner, ...rest] = normalized.split('/')
  const isOwner = owner === uid
  const isAdmin = role === 'system-admin' || role === 'nurse-admin'
  if (!isOwner && !isAdmin) {
    const err: any = new Error('forbidden')
    err.status = 403
    throw err
  }
  return { uid, isAdmin }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }
  try {
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const path = String(formData.get('path') || '')
    if (!file || !path)
      return NextResponse.json({ error: 'file and path required' }, { status: 400 })

    await assertOwnershipOrAdmin({ req, path })

    const buf = Buffer.from(await file.arrayBuffer())
    const filePath = path.replace(/^\//, '')
    const bucketFile = adminBucket.file(filePath)
    await bucketFile.save(buf, {
      contentType: file.type || 'application/octet-stream',
      resumable: false,
      public: false,
    })

    return NextResponse.json({ ok: true, path: filePath })
  } catch (e: any) {
    if (e?.message === 'unauth') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (e?.status === 403) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
