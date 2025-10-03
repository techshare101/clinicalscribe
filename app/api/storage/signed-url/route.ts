export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminBucket } from '@/lib/firebaseAdmin'

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

  const [top, owner] = normalized.split('/')
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
  try {
    // Require auth header
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const path = String(body?.path || '')
    const expiresInSecRaw = Number(body?.expiresInSec)
    if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

    // AuthZ + ownership check
    await assertOwnershipOrAdmin({ req, path })

    const filePath = path.replace(/^\//, '')
    const bucketFile = adminBucket.file(filePath)

    // Ensure file exists to provide a clearer 404
    const [exists] = await bucketFile.exists()
    if (!exists) return NextResponse.json({ error: 'not found' }, { status: 404 })

    // Clamp expiry to sane bounds: default 300s, min 60s, max 3600s
    const now = Date.now()
    const expiresInSec = Number.isFinite(expiresInSecRaw)
      ? Math.min(Math.max(Math.floor(expiresInSecRaw), 60), 3600)
      : 300
    const expiresAt = new Date(now + expiresInSec * 1000)

    const [url] = await bucketFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expiresAt, // Date object supported by v4 signing
    })

    return NextResponse.json({ url, expiresAt: expiresAt.toISOString() })
  } catch (e: any) {
    if (e?.message === 'unauth') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (e?.status === 403) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
