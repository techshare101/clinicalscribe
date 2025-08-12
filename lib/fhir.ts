// lib/fhir.ts
// Lightweight helpers to build FHIR resources from app data.

// Reference: FHIR R4 - DocumentReference
// https://www.hl7.org/fhir/documentreference.html

export type SOAPNoteLike = {
  subjective: string
  objective: string
  assessment: string
  plan: string
  patientName?: string
  encounterType?: string
  timestamp?: string | number | Date
}

export type PatientMeta = {
  id?: string // FHIR Patient.id if available
  name?: string
}

export type AuthorMeta = {
  id?: string // FHIR Practitioner.id or Organization.id
  name?: string
}

export type DocumentReferenceInput = {
  soap: SOAPNoteLike
  patient?: PatientMeta
  author?: AuthorMeta
  attachmentUrl?: string // URL to uploaded HTML/PDF
  attachmentContentType?: string // e.g., 'text/html', 'application/pdf'
}

export function buildSoapPlainText(soap: SOAPNoteLike): string {
  const lines: string[] = []
  lines.push('Subjective:')
  lines.push(soap.subjective?.trim() || 'N/A')
  lines.push('')
  lines.push('Objective:')
  lines.push(soap.objective?.trim() || 'N/A')
  lines.push('')
  lines.push('Assessment:')
  lines.push(soap.assessment?.trim() || 'N/A')
  lines.push('')
  lines.push('Plan:')
  lines.push(soap.plan?.trim() || 'N/A')
  return lines.join('\n')
}

export function toISOStringSafe(value?: string | number | Date): string {
  if (!value) return new Date().toISOString()
  try {
    const d = new Date(value)
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

// Minimal FHIR DocumentReference for a SOAP note.
// NOTE: Extend with patient/practitioner references once FHIR IDs are available.
function base64EncodeUtf8(text: string): string {
  // Works in Edge runtime and browsers; falls back if Buffer exists
  try {
    // Prefer web-safe btoa if available
    if (typeof (globalThis as any).btoa === 'function') {
      // encodeURIComponent to handle UTF-8
      return (globalThis as any).btoa(unescape(encodeURIComponent(text)))
    }
  } catch {
    // ignore and fallback below
  }
  try {
    if (typeof (globalThis as any).Buffer !== 'undefined') {
      return (globalThis as any).Buffer.from(text, 'utf-8').toString('base64')
    }
  } catch {
    // ignore
  }
  // Last resort: TextEncoder to bytes, then manual base64
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  const btoaFn = (globalThis as any).btoa || ((str: string) => {
    // Minimal base64 for ASCII only; our binary is safe
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let output = ''
    for (let i = 0; i < str.length; i += 3) {
      const a = str.charCodeAt(i)
      const b = str.charCodeAt(i + 1)
      const c = str.charCodeAt(i + 2)
      const b1 = a >> 2
      const b2 = ((a & 3) << 4) | (b >> 4)
      const b3 = isNaN(b) ? 64 : ((b & 15) << 2) | (c >> 6)
      const b4 = isNaN(b) || isNaN(c) ? 64 : c & 63
      output += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4)
    }
    return output
  })
  return btoaFn(binary)
}

// Minimal FHIR DocumentReference for a SOAP note.
// NOTE: Extend with patient/practitioner references once FHIR IDs are available.
export function buildDocumentReference(input: DocumentReferenceInput) {
  const { soap, patient, author, attachmentUrl, attachmentContentType } = input

  const issued = toISOStringSafe(soap.timestamp)
  const subject: any = {}
  if (patient?.id) {
    subject.reference = `Patient/${patient.id}`
  }
  if (patient?.name) {
    subject.display = patient.name
  } else if (soap.patientName) {
    subject.display = soap.patientName
  }

  const authorRef: any[] = []
  if (author?.id) {
    authorRef.push({ reference: `Practitioner/${author.id}`, display: author.name })
  } else if (author?.name) {
    authorRef.push({ display: author.name })
  }

  // Default to plain text attachment if no URL is provided
  const content: any[] = []
  if (attachmentUrl) {
    content.push({
      attachment: {
        contentType: attachmentContentType || 'text/html',
        url: attachmentUrl,
        title: 'SOAP Note',
      },
    })
  } else {
    const text = buildSoapPlainText(soap)
    const b64 = base64EncodeUtf8(text)
    content.push({
      attachment: {
        contentType: 'text/plain',
        data: b64,
        title: 'SOAP Note',
      },
    })
  }

  const resource: any = {
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'final',
    type: {
      // LOINC 11506-3 "SOAP note"
      coding: [
        {
          system: 'http://loinc.org',
          code: '11506-3',
          display: 'SOAP note',
        },
      ],
      text: 'SOAP note',
    },
    subject: Object.keys(subject).length ? subject : undefined,
    date: issued,
    author: authorRef.length ? authorRef : undefined,
    description: 'SOAP formatted clinical note',
    content,
    context: soap.encounterType
      ? {
          encounter: [{ display: soap.encounterType }],
        }
      : undefined,
  }

  // Remove undefined keys to keep resource clean
  Object.keys(resource).forEach((k) => resource[k] === undefined && delete resource[k])

  return resource
}
