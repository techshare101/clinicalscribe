export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const access = req.cookies.get('smart_access_token')?.value
    const fhirBaseCookie = req.cookies.get('smart_fhir_base')?.value

    if (!access || !fhirBaseCookie) {
      return NextResponse.json({ error: 'Not connected to SMART/EHR' }, { status: 401 })
    }

    const fhirBase = (process.env.SMART_FHIR_BASE || fhirBaseCookie).replace(/\/$/, '')

    const docRef = await req.json().catch(() => null)
    if (!docRef || typeof docRef !== 'object') {
      return NextResponse.json({ error: 'Invalid DocumentReference payload' }, { status: 400 })
    }

    const target = `${fhirBase}/DocumentReference`
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify(docRef),
    })

    const responseBody = await res.json().catch(async () => ({ text: await res.text().catch(() => '') }))
    if (!res.ok) {
      return NextResponse.json(
        { posted: false, server: fhirBase, error: responseBody?.issue || responseBody || 'EHR post failed' },
        { status: res.status }
      )
    }

    const resourceId = responseBody?.id || (res.headers.get('location') || '').split('/').pop() || null
    return NextResponse.json({ posted: true, server: fhirBase, resourceId, response: responseBody })
  } catch (err: any) {
    return NextResponse.json({ posted: false, error: err?.message || 'Server error' }, { status: 500 })
  }
}
