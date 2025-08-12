// app/api/fhir/document-reference/route.ts
import { NextResponse } from 'next/server'
import { buildDocumentReference, SOAPNoteLike } from '@/lib/fhir'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const soap: SOAPNoteLike = {
      subjective: body?.soap?.subjective ?? body?.subjective ?? '',
      objective: body?.soap?.objective ?? body?.objective ?? '',
      assessment: body?.soap?.assessment ?? body?.assessment ?? '',
      plan: body?.soap?.plan ?? body?.plan ?? '',
      patientName: body?.soap?.patientName ?? body?.patientName,
      encounterType: body?.soap?.encounterType ?? body?.encounterType,
      timestamp: body?.soap?.timestamp ?? body?.timestamp,
    }

    const patient = body?.patient || (body?.patientId || body?.patientName
      ? { id: body?.patientId, name: body?.patientName }
      : undefined)

    const author = body?.author || (body?.authorId || body?.authorName
      ? { id: body?.authorId, name: body?.authorName }
      : undefined)

    const docRef = buildDocumentReference({
      soap,
      patient,
      author,
      attachmentUrl: body?.attachmentUrl,
      attachmentContentType: body?.attachmentContentType,
    })

    return NextResponse.json(docRef)
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to build FHIR DocumentReference', details: err?.message }, { status: 400 })
  }
}
