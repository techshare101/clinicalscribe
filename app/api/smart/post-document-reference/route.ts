export const runtime = 'nodejs'

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

function normalizeRef(ref?: string | null, resourceType?: string): string | undefined {
  if (!ref) return undefined
  if (!resourceType) return ref
  return ref.includes('/') ? ref : `${resourceType}/${ref}`
}

function normalizeAuthorRef(ref?: string | null): string | undefined {
  if (!ref) return undefined
  if (ref.includes('/')) {
    const resourceType = ref.split('/')[0]
    const allowedAuthorTypes = new Set([
      'Practitioner',
      'PractitionerRole',
      'Organization',
      'Patient',
      'RelatedPerson',
      'Device',
    ])
    return allowedAuthorTypes.has(resourceType) ? ref : undefined
  }
  return `Practitioner/${ref}`
}

/**
 * Query Epic FHIR for the most recent active encounter for a patient.
 * Returns an Encounter reference string like "Encounter/e123" or undefined.
 */
async function fetchActiveEncounter(
  fhirBase: string,
  patientId: string,
  accessToken: string
): Promise<string | undefined> {
  try {
    const url = `${fhirBase}/Encounter?patient=${patientId}&status=planned,arrived,in-progress,triaged&_sort=-date&_count=1`
    console.log('[post-document-reference] Fetching active encounter:', url)
    const res = await fetch(url, {
      headers: {
        Accept: 'application/fhir+json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!res.ok) {
      console.warn('[post-document-reference] Encounter search failed:', res.status)
      return undefined
    }
    const bundle = await res.json()
    const entry = bundle?.entry?.[0]?.resource
    if (entry?.resourceType === 'Encounter' && entry?.id) {
      console.log('[post-document-reference] Found active encounter:', entry.id)
      return `Encounter/${entry.id}`
    }
    // Fallback: try finished encounters if no active ones
    const fallbackUrl = `${fhirBase}/Encounter?patient=${patientId}&_sort=-date&_count=1`
    console.log('[post-document-reference] No active encounter, trying most recent:', fallbackUrl)
    const fallbackRes = await fetch(fallbackUrl, {
      headers: {
        Accept: 'application/fhir+json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!fallbackRes.ok) return undefined
    const fallbackBundle = await fallbackRes.json()
    const fallbackEntry = fallbackBundle?.entry?.[0]?.resource
    if (fallbackEntry?.resourceType === 'Encounter' && fallbackEntry?.id) {
      console.log('[post-document-reference] Found recent encounter:', fallbackEntry.id)
      return `Encounter/${fallbackEntry.id}`
    }
    return undefined
  } catch (err) {
    console.warn('[post-document-reference] Encounter lookup error:', err)
    return undefined
  }
}

function parseOperationOutcomeMessage(bodyText: string): string | null {
  try {
    const parsed = JSON.parse(bodyText)
    if (parsed?.resourceType !== 'OperationOutcome' || !Array.isArray(parsed?.issue)) return null
    const parts = parsed.issue
      .map((i: any) => i?.diagnostics || i?.details?.text)
      .filter(Boolean)
    return parts.length ? parts.join(' | ') : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── 1. Resolve SMART access token from httpOnly cookies ──
    const cookieStore = await cookies()
    const token = cookieStore.get('smart_access_token')?.value
    const base = (
      cookieStore.get('smart_fhir_base')?.value ||
      process.env.SMART_FHIR_BASE ||
      'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'
    ).replace(/\/$/, '')
    const smartPatient = cookieStore.get('smart_patient')?.value
    const smartPractitioner = cookieStore.get('smart_practitioner')?.value
    const smartEncounter = cookieStore.get('smart_encounter')?.value
    const smartFhirUser = cookieStore.get('smart_fhir_user')?.value

    if (!token) {
      return NextResponse.json(
        { ok: false, posted: false, status: 401, message: 'No active EHR connection. Connect to Epic first.' },
        { status: 401 }
      )
    }

    // ── 2. Resolve the FHIR DocumentReference to POST ──
    let fhirDocRef: any

    if (body?.resourceType === 'DocumentReference') {
      // Client already built the resource (sent by ExportToEHR component)
      fhirDocRef = body

      // Fill in SMART launch context references if client left required fields blank.
      const patientRef = normalizeRef(smartPatient, 'Patient')
      const practitionerRef = normalizeRef(smartPractitioner, 'Practitioner') || normalizeAuthorRef(smartFhirUser)
      const encounterRef = normalizeRef(smartEncounter, 'Encounter')

      const normalizedSubjectRef = normalizeRef(fhirDocRef?.subject?.reference, 'Patient')
      if (normalizedSubjectRef) {
        fhirDocRef.subject = { ...(fhirDocRef.subject || {}), reference: normalizedSubjectRef }
      } else if (patientRef) {
        fhirDocRef.subject = { ...(fhirDocRef.subject || {}), reference: patientRef }
      }

      const currentAuthor = Array.isArray(fhirDocRef.author) ? fhirDocRef.author : []
      const normalizedAuthor = currentAuthor
        .map((a: any) => ({ ...a, reference: normalizeAuthorRef(a?.reference) }))
        .filter((a: any) => !!a?.reference)
      if (normalizedAuthor.length > 0) {
        fhirDocRef.author = normalizedAuthor
      } else if (practitionerRef) {
        fhirDocRef.author = [{ reference: practitionerRef }]
      }

      const currentEncounter = Array.isArray(fhirDocRef?.context?.encounter)
        ? fhirDocRef.context.encounter
        : []
      const normalizedEncounter = currentEncounter
        .map((e: any) => ({ ...e, reference: normalizeRef(e?.reference, 'Encounter') }))
        .filter((e: any) => !!e?.reference)

      if (encounterRef && !normalizedEncounter.some((e: any) => e.reference === encounterRef)) {
        normalizedEncounter.unshift({ reference: encounterRef })
      }

      // If no encounter reference from cookies or client, try fetching one from Epic
      if (normalizedEncounter.length === 0) {
        const patientId = fhirDocRef?.subject?.reference?.replace('Patient/', '')
        if (patientId && token) {
          const fetchedEncounter = await fetchActiveEncounter(base, patientId, token)
          if (fetchedEncounter) {
            normalizedEncounter.push({ reference: fetchedEncounter })
          }
        }
      }

      if (normalizedEncounter.length > 0) {
        fhirDocRef.context = {
          ...(fhirDocRef.context || {}),
          encounter: normalizedEncounter,
        }
      } else if (fhirDocRef?.context?.encounter) {
        const contextWithoutEncounter = { ...(fhirDocRef.context || {}) }
        delete contextWithoutEncounter.encounter
        fhirDocRef.context = Object.keys(contextWithoutEncounter).length ? contextWithoutEncounter : undefined
      }

      // Epic profile-safe defaults
      if (!fhirDocRef?.type?.coding?.length) {
        fhirDocRef.type = {
          ...(fhirDocRef.type || {}),
          coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'SOAP note' }],
          text: fhirDocRef?.type?.text || 'SOAP note',
        }
      }
      if (!Array.isArray(fhirDocRef?.content) || fhirDocRef.content.length === 0) {
        return NextResponse.json(
          { ok: false, status: 400, message: 'DocumentReference.content is required before sending to Epic' },
          { status: 400 }
        )
      }
      // Log SMART context diagnostics — never block the POST. Let Epic decide
      // what references are required and return its own OperationOutcome if missing.
      const smartContextSummary = {
        patient: smartPatient || null,
        practitioner: smartPractitioner || null,
        encounter: smartEncounter || null,
        fhirUser: smartFhirUser || null,
        hasSubjectRef: !!fhirDocRef?.subject?.reference,
        hasAuthorRef: Array.isArray(fhirDocRef?.author) && fhirDocRef.author.some((a: any) => !!a?.reference),
        hasEncounterRef: Array.isArray(fhirDocRef?.context?.encounter) && fhirDocRef.context.encounter.some((e: any) => !!e?.reference),
      }
      console.log('[post-document-reference] SMART context:', smartContextSummary)
    } else if (body?.reportId) {
      // Legacy path: look up the report from Firestore and build the resource
      const reportSnap = await adminDb.collection('reports').doc(body.reportId).get()
      if (!reportSnap.exists) {
        return NextResponse.json({ ok: false, status: 404, message: 'Report not found' }, { status: 404 })
      }
      const data = reportSnap.data() as any

      fhirDocRef = {
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
    } else {
      return NextResponse.json(
        { ok: false, status: 400, message: 'Request must include a FHIR DocumentReference body or a reportId' },
        { status: 400 }
      )
    }

    // ── 3. POST to Epic FHIR endpoint ──
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
      return NextResponse.json({
        ok: true,
        posted: true,
        status,
        server: base,
        resourceId: id,
        response: bodyText,
        base,
      })
    }

    const outcomeMessage = parseOperationOutcomeMessage(bodyText)
    console.error('[post-document-reference] Epic rejected:', { status, outcomeMessage, bodyText: bodyText?.slice(0, 500) })
    return NextResponse.json(
      {
        ok: false,
        posted: false,
        status,
        message: outcomeMessage || bodyText || 'Epic returned error',
        operationOutcome: bodyText,
        wwwAuthenticate: wwwAuth,
        base,
        smartContext: {
          patient: smartPatient || null,
          practitioner: smartPractitioner || null,
          encounter: smartEncounter || null,
          fhirUser: smartFhirUser || null,
        },
      },
      { status }
    )
  } catch (err: any) {
    return NextResponse.json({ ok: false, posted: false, status: 500, message: err?.message || 'Internal error' }, { status: 500 })
  }
}
