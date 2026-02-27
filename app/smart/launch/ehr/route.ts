import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * EHR Launch Entry Point
 *
 * This is the URL registered as the "Launch URL" in Epic App Orchard.
 * When a clinician launches ClinicalScribe from inside the EHR (Hyperspace),
 * Epic calls this endpoint with two query parameters:
 *   - iss:    the FHIR base URL of the EHR (e.g. https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4)
 *   - launch: an opaque token that ties this session to the EHR context
 *
 * This route validates both, then redirects to the main /smart/launch handler
 * which builds the authorize URL including the launch token.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const iss = searchParams.get('iss')
  const launch = searchParams.get('launch')
  const debug = searchParams.get('debug') === '1'

  if (!iss || !launch) {
    const payload = {
      error: 'Missing required EHR launch parameters',
      detail: {
        iss: iss ? 'present' : 'MISSING',
        launch: launch ? 'present' : 'MISSING',
      },
      hint: 'This endpoint must be called by the EHR with ?iss=<fhirBase>&launch=<token>',
    }
    return NextResponse.json(payload, { status: 400 })
  }

  // Validate iss is a proper URL
  try {
    new URL(iss)
  } catch {
    return NextResponse.json(
      { error: 'iss is not a valid URL', iss },
      { status: 400 }
    )
  }

  // Optional: restrict iss to known FHIR servers for security
  const allowedIssuers = (process.env.SMART_ALLOWED_ISS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (allowedIssuers.length > 0) {
    const issNorm = iss.replace(/\/$/, '')
    const allowed = allowedIssuers.some((a) => issNorm === a.replace(/\/$/, ''))
    if (!allowed) {
      return NextResponse.json(
        { error: 'iss not in allowed list', iss, allowed: allowedIssuers },
        { status: 403 }
      )
    }
  }

  // Build redirect to the main /smart/launch handler with fhirBase + launch
  const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
  const url = new URL('/smart/launch', base)
  url.searchParams.set('fhirBase', iss)
  url.searchParams.set('launch', launch)

  if (debug) {
    return NextResponse.json({
      ok: true,
      flow: 'ehr-launch',
      redirect: url.toString(),
      params: { iss, launch, base },
    })
  }

  return NextResponse.redirect(url.toString())
}
