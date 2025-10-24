export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { reportId } = (await req.json()) as { reportId?: string }
    if (!reportId) {
      return NextResponse.json({ ok: false, status: 400, message: 'Missing reportId' }, { status: 400 })
    }

    // Load SMART config
    const cfgSnap = await adminDb.collection('smart').doc('config').get()
    if (!cfgSnap.exists) {
      return NextResponse.json({ ok: false, status: 0, message: 'No SMART config' }, { status: 500 })
    }
    const cfg = cfgSnap.data() as any
    const token = cfg?.access_token || cfg?.token
    const base = (cfg?.fhir_base || process.env.SMART_FHIR_BASE || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4').replace(/\/$/, '')
    if (!token || !base) {
      return NextResponse.json({ ok: false, status: 0, message: 'Missing access_token or fhir_base' }, { status: 500 })
    }

    // Load report
    const reportSnap = await adminDb.collection('reports').doc(reportId).get()
    if (!reportSnap.exists) {
      return NextResponse.json({ ok: false, status: 404, message: 'Report not found' }, { status: 404 })
    }
    const data = reportSnap.data() as any

    // Build FHIR DocumentReference
    const fhirDocRef = {
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

    // POST to Epic FHIR sandbox
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
      return NextResponse.json({ ok: true, status, id, response: bodyText, base })
    }

    return NextResponse.json(
      {
        ok: false,
        status,
        message: bodyText || 'Epic returned error',
        wwwAuthenticate: wwwAuth,
        base,
      },
      { status }
    )
  } catch (err: any) {
    return NextResponse.json({ ok: false, status: 500, message: err?.message || 'Internal error' }, { status: 500 })
  }
}
