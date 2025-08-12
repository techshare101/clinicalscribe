export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('smart_access_token')?.value
    const fhirBase = req.cookies.get('smart_fhir_base')?.value

    return NextResponse.json({
      connected: !!(token && fhirBase),
      fhirBase: fhirBase ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ connected: false, fhirBase: null, error: e?.message || 'status error' }, { status: 200 })
  }
}
