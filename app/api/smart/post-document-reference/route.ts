export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get('debug') === '1'
  try {
    const access = req.cookies.get('smart_access_token')?.value
    const fhirBaseCookie = req.cookies.get('smart_fhir_base')?.value

    if (!access || !fhirBaseCookie) {
      const payload = { error: 'Not connected to SMART/EHR' }
      return NextResponse.json(debug ? { ok: false, ...payload } : payload, { status: 401 })
    }

    const fhirBase = (process.env.SMART_FHIR_BASE || fhirBaseCookie).replace(/\/$/, '')

    const docRef = await req.json().catch(() => null)
    if (!docRef || typeof docRef !== 'object') {
      const payload = { error: 'Invalid DocumentReference payload' }
      return NextResponse.json(debug ? { ok: false, ...payload } : payload, { status: 400 })
    }

    const target = `${fhirBase}/DocumentReference`
    const headers = {
      'Content-Type': 'application/fhir+json',
      Authorization: `Bearer ${access}`,
    }

    const res = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(docRef),
    })

    const text = await res.text().catch(() => '')
    let responseBody: any
    try {
      responseBody = JSON.parse(text)
    } catch {
      responseBody = { text }
    }

    if (!res.ok) {
      const payload = {
        posted: false,
        server: fhirBase,
        status: res.status,
        error: responseBody?.issue || responseBody || 'EHR post failed',
      }
      return NextResponse.json(
        debug
          ? {
              ok: false,
              ...payload,
              debug: {
                target,
                usedFhirBase: fhirBase,
                request: {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/fhir+json', Authorization: 'Bearer ***' },
                  body: docRef,
                },
                response: { status: res.status, body: responseBody },
              },
            }
          : payload,
        { status: res.status }
      )
    }

    const resourceId = responseBody?.id || (res.headers.get('location') || '').split('/').pop() || null
    const payload = { posted: true, server: fhirBase, resourceId, response: responseBody }
    return NextResponse.json(
      debug
        ? {
            ok: true,
            ...payload,
            debug: {
              target,
              usedFhirBase: fhirBase,
              request: {
                method: 'POST',
                headers: { 'Content-Type': 'application/fhir+json', Authorization: 'Bearer ***' },
                body: docRef,
              },
              response: { status: res.status, body: responseBody },
            },
          }
        : payload
    )
  } catch (err: any) {
    const payload = { posted: false, error: err?.message || 'Server error' }
    return NextResponse.json(debug ? { ok: false, ...payload } : payload, { status: 500 })
  }
}
