import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const fhirBase = process.env.SMART_FHIR_BASE
  const debug = req.nextUrl.searchParams.get('debug') === '1'

  if (!fhirBase) {
    const payload = { error: 'SMART_FHIR_BASE not configured' }
    return NextResponse.json(debug ? { ok: false, ...payload } : payload, { status: 500 })
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin || 'http://localhost:3000'
  const url = new URL('/smart/launch', base)
  url.searchParams.set('fhirBase', fhirBase)

  if (debug) {
    return NextResponse.json({
      ok: true,
      redirect: url.toString(),
      params: { fhirBase, base },
    })
  }

  return NextResponse.redirect(url.toString())
}
