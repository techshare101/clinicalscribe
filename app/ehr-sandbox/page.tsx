// app/ehr-sandbox/page.tsx
'use client'

import React, { useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function tryParseJSON(value: string): any | null {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export default function EHRExportSandboxPage() {
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [patientName, setPatientName] = useState('')
  const [encounterType, setEncounterType] = useState('Office visit')
  const [authorName, setAuthorName] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [output, setOutput] = useState<string>('')
  const [error, setError] = useState<string>('')

  const canSubmit = useMemo(() => {
    return [subjective, objective, assessment, plan].some((s) => s.trim().length > 0)
  }, [subjective, objective, assessment, plan])

  async function buildFHIR() {
    setError('')
    setOutput('')
    try {
      const res = await fetch('/api/fhir/document-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soap: { subjective, objective, assessment, plan, patientName, encounterType, timestamp: new Date().toISOString() },
          author: authorName ? { name: authorName } : undefined,
          attachmentUrl: attachmentUrl || undefined,
          attachmentContentType: attachmentUrl ? 'text/html' : undefined,
        }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg?.error || 'Failed to build FHIR resource')
      }
      const json = await res.json()
      setOutput(JSON.stringify(json, null, 2))
    } catch (e: any) {
      setError(e?.message || 'Unexpected error')
    }
  }

  function copyOutput() {
    if (!output) return
    navigator.clipboard.writeText(output)
  }

  function downloadOutput() {
    if (!output) return
    const blob = new Blob([output], { type: 'application/fhir+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document-reference.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const parsedExample = tryParseJSON(output)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>EHR Export Sandbox</CardTitle>
            <CardDescription>
              Build and preview a FHIR R4 DocumentReference for a SOAP note. This is a developer sandbox to test EHR integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <a
                href={`/smart/launch?fhirBase=${encodeURIComponent('https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4')}`}
                className="inline-flex items-center px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Connect to EHR (SMART)
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input placeholder="Patient name (optional)" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                <Input placeholder="Encounter type (e.g., Office visit)" value={encounterType} onChange={(e) => setEncounterType(e.target.value)} />
                <Input placeholder="Author name (optional)" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
                <Input placeholder="Attachment URL (HTML/PDF optional)" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} />
              </div>
              <div className="space-y-4">
                <Textarea placeholder="Subjective" rows={4} value={subjective} onChange={(e) => setSubjective(e.target.value)} />
                <Textarea placeholder="Objective" rows={4} value={objective} onChange={(e) => setObjective(e.target.value)} />
                <Textarea placeholder="Assessment" rows={4} value={assessment} onChange={(e) => setAssessment(e.target.value)} />
                <Textarea placeholder="Plan" rows={4} value={plan} onChange={(e) => setPlan(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={buildFHIR} disabled={!canSubmit}>Build FHIR DocumentReference</Button>
              <Button variant="secondary" onClick={copyOutput} disabled={!output}>Copy JSON</Button>
              <Button variant="outline" onClick={downloadOutput} disabled={!output}>Download JSON</Button>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <Separator />

            <div>
              <div className="text-sm text-gray-600 mb-2">Output (FHIR DocumentReference)</div>
              <pre className="bg-black text-green-200 p-4 rounded-md overflow-auto max-h-96 text-xs">
                {output || '// The FHIR JSON will appear here'}
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
