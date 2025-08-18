"use client"

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { DownloadPdfButton } from '@/components/DownloadPdfButton'

export default function DevPdfTestPage() {
  const [uid, setUid] = useState<string | null>(null)
  const [pdfPath, setPdfPath] = useState<string>("")
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUid(u?.uid || null))
    return () => unsub()
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Dev PDF Smoke</h1>
        <p className="text-sm text-red-600">This helper page is disabled in production.</p>
      </div>
    )
  }

  async function renderPdf() {
    setError("")
    setRendering(true)
    try {
      if (!uid) throw new Error('Sign in to render a test PDF.')
      const res = await fetch('/api/pdf/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: uid,
          html: `<h1>Test PDF</h1><p>Generated at ${new Date().toLocaleString()}</p>`,
        }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) throw new Error(data?.error || 'Render failed')
      setPdfPath(String(data.path || ''))
    } catch (e: any) {
      setError(e?.message || 'Failed to render PDF')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dev: PDF Render + Signed URL Smoke</h1>
      {!uid ? (
        <p className="text-sm text-yellow-700">Sign in to continue.</p>
      ) : (
        <p className="text-sm text-gray-600">Signed in as <span className="font-mono">{uid}</span></p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={renderPdf}
          disabled={!uid || rendering}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {rendering ? 'Rendering…' : 'Render Test PDF'}
        </button>
        {pdfPath ? <span className="text-xs text-gray-500">{pdfPath}</span> : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {pdfPath ? (
        <div className="pt-2">
          <DownloadPdfButton pdfPath={pdfPath} />
        </div>
      ) : null}

      <p className="text-xs text-gray-500">
        Flow: Render writes to Firebase Storage under <code>pdfs/&lt;uid&gt;/...</code> → Button fetches a signed URL at
        <code> /api/storage/signed-url</code> and opens it.
      </p>
    </div>
  )
}
