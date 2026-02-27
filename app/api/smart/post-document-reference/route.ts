export const runtime = 'nodejs'

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── 1. Resolve SMART access token from httpOnly cookies ──
    const cookieStore = await cookies()
    const token = cookieStore.get('smart_access_token')?.value
    const base = (
      cookieStore.get('smart_fhir_base')?.value ||
      process.env.SMART_FHIR_BASE ||
      'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'
    ).replace(/\/$/, '')

    if (!token) {
      return NextResponse.json(
        { ok: false, posted: false, status: 401, message: 'No active EHR connection. Connect to Epic first.' },
        { status: 401 }
      )
    }

    // ── 2. Resolve the FHIR DocumentReference to POST ──
    let fhirDocRef: any

    if (body?.resourceType === 'DocumentReference') {
      // Client already built the resource (sent by ExportToEHR component)
      fhirDocRef = body
    } else if (body?.reportId) {
      // Legacy path: look up the report from Firestore and build the resource
      const reportSnap = await adminDb.collection('reports').doc(body.reportId).get()
      if (!reportSnap.exists) {
        return NextResponse.json({ ok: false, status: 404, message: 'Report not found' }, { status: 404 })
      }
      const data = reportSnap.data() as any

      fhirDocRef = {
        resourceType: 'DocumentReference',
        status: 'current',
        type: { text: data?.type || 'SOAP Note' },
        subject: { reference: `Patient/${data?.patientId || 'example'}` },
        author: [
          {
            reference: `Practitioner/${data?.uid || data?.userId || 'unknown'}`,
            display: data?.author || data?.authorName || 'Clinician',
          },
        ],
        date: new Date().toISOString(),
        content: [
          {
            attachment: {
              contentType: data?.contentType || 'application/pdf',
              url: data?.pdfUrl || data?.url || '',
            },
          },
        ],
      }
    } else {
      return NextResponse.json(
        { ok: false, status: 400, message: 'Request must include a FHIR DocumentReference body or a reportId' },
        { status: 400 }
      )
    }

    // ── 3. POST to Epic FHIR endpoint ──
    const resp = await fetch(`${base}/DocumentReference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fhirDocRef),
    })

    const status = resp.status
    const wwwAuth = resp.headers.get('www-authenticate') || resp.headers.get('WWW-Authenticate') || null
    const bodyText = await resp.text().catch(() => '')

    if (resp.ok || status === 201) {
      let id: string | undefined
      try {
        id = JSON.parse(bodyText)?.id
      } catch {}
      return NextResponse.json({
        ok: true,
        posted: true,
        status,
        server: base,
        resourceId: id,
        response: bodyText,
        base,
      })
    }

    return NextResponse.json(
      {
        ok: false,
        posted: false,
        status,
        message: bodyText || 'Epic returned error',
        wwwAuthenticate: wwwAuth,
        base,
      },
      { status }
    )
  } catch (err: any) {
    return NextResponse.json({ ok: false, posted: false, status: 500, message: err?.message || 'Internal error' }, { status: 500 })
  }
}
