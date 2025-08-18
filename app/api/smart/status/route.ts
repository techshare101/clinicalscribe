import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const access = req.cookies.get('smart_access_token')?.value
    const fhirBase = req.cookies.get('smart_fhir_base')?.value

    const connected = Boolean(access && fhirBase)
    return NextResponse.json({ connected, fhirBase: fhirBase ?? null })
  } catch (err: any) {
    return NextResponse.json({ connected: false, fhirBase: null, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
