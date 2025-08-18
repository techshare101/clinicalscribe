import { storage } from '@/lib/firebase'
import { ref, uploadBytes } from 'firebase/storage'

export async function renderPdf(html: string, watermark?: string): Promise<Blob> {
  const res = await fetch('/api/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, watermark }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || 'Failed to render PDF')
  }
  return await res.blob()
}

export async function uploadPdf(uid: string, id: string, pdf: Blob): Promise<string> {
  const path = `pdfs/${uid}/${id}.pdf`
  const r = ref(storage, path)
  await uploadBytes(r, pdf, { contentType: 'application/pdf' })
  return path
}

export async function renderAndUploadPDF(html: string, uid: string, id: string, watermark = 'ClinicalScribe Beta') {
  const pdf = await renderPdf(html, watermark)
  const path = await uploadPdf(uid, id, pdf)
  return { ok: true as const, path }
}
