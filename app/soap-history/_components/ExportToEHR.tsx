"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type NoteLike = {
  id: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  createdAt?: any
  patientName?: string
}

type PatientLike = { id?: string; name?: string }
type AuthorLike = { id?: string; name?: string }

type Props = {
  note: NoteLike
  patient?: PatientLike
  author?: AuthorLike
  attachment?: { url?: string; contentType?: string }
}

export function ExportToEHR({ note, patient, author, attachment }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [docRefPreview, setDocRefPreview] = useState<any>(null)

  async function handleExport() {
    setLoading(true)
    setMessage('')
    setError('')
    setDocRefPreview(null)
    try {
      // Build timestamp from note.createdAt if it's a Firestore Timestamp
      let timestamp: string | undefined
      try {
        if (note?.createdAt?.seconds) {
          timestamp = new Date(note.createdAt.seconds * 1000).toISOString()
        } else if (note?.createdAt) {
          const d = new Date(note.createdAt)
          timestamp = isNaN(d.getTime()) ? undefined : d.toISOString()
        }
      } catch {
        // ignore
      }

      // 1) Build DocumentReference via API
      const buildRes = await fetch('/api/fhir/document-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soap: {
            subjective: note.subjective,
            objective: note.objective,
            assessment: note.assessment,
            plan: note.plan,
            patientName: patient?.name || note.patientName,
            timestamp: timestamp || new Date().toISOString(),
          },
          patient,
          author,
          attachmentUrl: attachment?.url,
          attachmentContentType: attachment?.contentType,
        }),
      })
      if (!buildRes.ok) {
        const msg = await buildRes.json().catch(() => ({}))
        throw new Error(msg?.error || 'Failed to build FHIR resource')
      }
      const docRef = await buildRes.json()
      setDocRefPreview(docRef)

      // 2) Server-side POST to EHR via proxy (SMART token stays httpOnly)
      let remote: any = null
      try {
        const post = await fetch('/api/smart/post-document-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docRef),
        })
        if (post.ok) {
          const data = await post.json()
          if (data.posted) {
            remote = { server: data.server, resourceId: data.resourceId, response: data.response }
          }
        } else if (post.status === 401) {
          // Not connected to SMART/EHR; continue with local export only
        } else {
          const errMsg = await post.json().catch(() => ({}))
          throw new Error(errMsg?.error || 'EHR post failed')
        }
      } catch (err) {
        // Swallow here; will mark failed in persistence below if needed
        console.error('EHR POST failed', err)
      }

      // 3) Persist export status locally
      const persistRes = await fetch('/api/notes/fhir-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          status: remote ? 'exported' : 'failed',
          docRef,
          posted: !!remote,
          remote,
        }),
      })
      const persist = await persistRes.json().catch(() => ({}))
      if (!persistRes.ok || !persist?.ok) {
        throw new Error('Failed to persist export status')
      }

      setMessage(remote ? 'Exported and posted to EHR.' : 'Export saved locally. Connect to SMART to post to an EHR or retry later.')
    } catch (e: any) {
      setError(e?.message || 'Export failed')
      try {
        await fetch('/api/notes/fhir-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId: note.id, status: 'failed', posted: false }),
        })
      } catch {
        // ignore follow-up failure
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Button onClick={handleExport} disabled={loading}>
          {loading ? 'Exporting…' : 'Export to EHR (FHIR)'}
        </Button>
        {message && <span className="text-green-700 text-sm">{message}</span>}
        {error && <span className="text-red-700 text-sm">{error}</span>}
      </div>
      {docRefPreview && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer underline">View FHIR JSON</summary>
          <pre className="mt-2 max-h-64 overflow-auto text-xs bg-black text-green-200 p-3 rounded-md">
            {JSON.stringify(docRefPreview, null, 2)}
          </pre>
        </details>
      )}
      <p className="text-xs text-gray-500">This builds a FHIR R4 DocumentReference and records status locally. Posting to EHR is proxied through the server for security.</p>
    </div>
  )
}
