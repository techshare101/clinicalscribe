import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const fhirBase = process.env.SMART_FHIR_BASE
  const debug = req.nextUrl.searchParams.get('debug') === '1'

  if (!fhirBase) {
    const payload = { error: 'SMART_FHIR_BASE not configured' }
    console.error('SMART_FHIR_BASE environment variable is not set')
    return NextResponse.json(debug ? { ok: false, ...payload } : payload, { status: 500 })
  }

  // Validate that fhirBase is a proper URL
  try {
    new URL(fhirBase)
  } catch (e) {
    const payload = { error: 'SMART_FHIR_BASE is not a valid URL' }
    console.error('SMART_FHIR_BASE is not a valid URL:', fhirBase)
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
