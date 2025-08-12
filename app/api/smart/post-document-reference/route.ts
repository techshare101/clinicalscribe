export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('smart_access_token')?.value
    const fhirBase = req.cookies.get('smart_fhir_base')?.value

    if (!token || !fhirBase) {
      return NextResponse.json({ error: 'Not connected to SMART/EHR' }, { status: 401 })
    }

    const docRef = await req.json()
    const target = `${fhirBase.replace(/\/$/, '')}/DocumentReference`

    const resp = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(docRef),
    })

    const json = await resp.json().catch(() => ({}))

    if (!resp.ok) {
      return NextResponse.json({ error: json || 'EHR post failed' }, { status: resp.status || 500 })
    }

    return NextResponse.json({
      posted: true,
      server: fhirBase,
      resourceId: json?.id,
      response: json,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error posting to EHR' }, { status: 500 })
  }
}
