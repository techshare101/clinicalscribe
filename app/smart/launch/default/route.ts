import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const fhirBase = process.env.SMART_FHIR_BASE
  if (!fhirBase) return NextResponse.json({ error: 'SMART_FHIR_BASE not configured' }, { status: 500 })
  const url = new URL('/smart/launch', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
  url.searchParams.set('fhirBase', fhirBase)
  return NextResponse.redirect(url.toString())
}
