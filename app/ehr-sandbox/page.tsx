// app/ehr-sandbox/page.tsx
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSmartStatus } from '@/hooks/use-smart-status'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ConnectToEHRButton from '@/components/ConnectToEHRButton'
import ConnectionLifecycle from '@/components/ConnectionLifecycle'
import {
  Database,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  Sparkles,
  Shield,
  Code,
  ArrowRight,
  Eye,
  Stethoscope,
  Brain,
  Clipboard,
  User,
  Link2,
  Terminal,
  Key,
  RefreshCw,
  Loader2
} from 'lucide-react'

function tryParseJSON(value: string): any | null {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const SOAP_SECTIONS = [
  { key: 'subjective', letter: 'S', label: 'Subjective', icon: Eye, borderColor: 'border-l-blue-500', dotColor: 'bg-blue-500' },
  { key: 'objective', letter: 'O', label: 'Objective', icon: Stethoscope, borderColor: 'border-l-emerald-500', dotColor: 'bg-emerald-500' },
  { key: 'assessment', letter: 'A', label: 'Assessment', icon: Brain, borderColor: 'border-l-amber-500', dotColor: 'bg-amber-500' },
  { key: 'plan', letter: 'P', label: 'Plan', icon: Clipboard, borderColor: 'border-l-indigo-500', dotColor: 'bg-indigo-500' },
] as const

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
  const [copied, setCopied] = useState(false)
  const [building, setBuilding] = useState(false)

  const smartStatus = useSmartStatus()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [previousConnectionStatus, setPreviousConnectionStatus] = useState<boolean | null>(null)

  // Show toast for OAuth callback results
  useEffect(() => {
    const smartParam = searchParams?.get('smart')
    const reason = searchParams?.get('reason')
    if (smartParam === 'error') {
      const msg = reason ? decodeURIComponent(reason) : 'Authentication failed. Please try again.'
      toast({
        title: "EHR Connection Failed",
        description: msg,
        variant: "destructive",
      })
    } else if (smartParam === 'connected') {
      toast({
        title: "EHR Connected",
        description: "Successfully connected to Epic SMART on FHIR.",
      })
    }
  }, [searchParams, toast])

  useEffect(() => {
    if (previousConnectionStatus !== null && previousConnectionStatus !== smartStatus.connected) {
      if (smartStatus.connected) {
        toast({
          title: "EHR Connected",
          description: "Successfully connected to Epic SMART on FHIR.",
        })
      } else {
        toast({
          title: "EHR Disconnected",
          description: "Connection to EHR has been lost. Please reconnect.",
        })
      }
    }
    setPreviousConnectionStatus(smartStatus.connected)
  }, [smartStatus.connected, previousConnectionStatus, toast])

  const soapValues: Record<string, string> = { subjective, objective, assessment, plan }
  const soapSetters: Record<string, (v: string) => void> = {
    subjective: setSubjective,
    objective: setObjective,
    assessment: setAssessment,
    plan: setPlan,
  }

  const canSubmit = useMemo(() => {
    return [subjective, objective, assessment, plan].some((s) => s.trim().length > 0)
  }, [subjective, objective, assessment, plan])

  async function buildFHIR() {
    setError('')
    setOutput('')
    setBuilding(true)
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
    } finally {
      setBuilding(false)
    }
  }

  function copyOutput() {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-5">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-emerald-300/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl" />

          <div className="relative px-6 py-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl ring-1 ring-white/25 shadow-lg">
                  <Database className="h-6 w-6 drop-shadow" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
                    EHR Integration Sandbox
                  </h1>
                  <p className="text-emerald-100/70 text-xs sm:text-sm mt-0.5 font-medium">
                    Build &amp; test FHIR DocumentReference resources with enterprise-grade integration
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm">
                  <Database className="h-3 w-3 mr-1" /> FHIR R4
                </Badge>
                <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm">
                  <Shield className="h-3 w-3 mr-1" /> SMART on FHIR
                </Badge>
                <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm">
                  <Code className="h-3 w-3 mr-1" /> Sandbox
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connection Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-4 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-t-2xl" />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${smartStatus.connected ? 'bg-emerald-500 animate-pulse' : smartStatus.loading ? 'bg-blue-400 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">EHR Connection</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {smartStatus.loading ? 'Checking...' : smartStatus.connected ? 'Connected to Epic' : 'Not connected'}
                </span>
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm transition-all duration-200">
              <ConnectToEHRButton />
            </div>
          </div>
        </motion.div>

        {/* Main Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column — Document Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-2xl" />
            <div className="flex items-center gap-2.5 mb-4 mt-1">
              <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Document Metadata</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">FHIR resource fields</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <User className="h-3 w-3" /> Patient Name
                </label>
                <Input
                  placeholder="e.g. John Doe (optional)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="h-9 text-sm bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-blue-200 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Stethoscope className="h-3 w-3" /> Encounter Type
                </label>
                <Input
                  placeholder="e.g. Office visit"
                  value={encounterType}
                  onChange={(e) => setEncounterType(e.target.value)}
                  className="h-9 text-sm bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-blue-200 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <User className="h-3 w-3" /> Author Name
                </label>
                <Input
                  placeholder="e.g. Dr. Smith (optional)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="h-9 text-sm bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-blue-200 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Link2 className="h-3 w-3" /> Attachment URL
                </label>
                <Input
                  placeholder="HTML/PDF URL (optional)"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="h-9 text-sm bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-blue-200 rounded-lg"
                />
              </div>
            </div>
          </motion.div>

          {/* Right Column — SOAP Content */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-t-2xl" />
            <div className="flex items-center gap-2.5 mb-4 mt-1">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">SOAP Note Content</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Clinical note sections</p>
              </div>
            </div>
            <div className="space-y-3">
              {SOAP_SECTIONS.map((section) => {
                const Icon = section.icon
                return (
                  <div key={section.key} className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <span className={`w-2 h-2 rounded-full ${section.dotColor}`} />
                      {section.label}
                    </label>
                    <Textarea
                      placeholder={section.label}
                      rows={2}
                      value={soapValues[section.key]}
                      onChange={(e) => soapSetters[section.key](e.target.value)}
                      className="text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-400 focus:ring-emerald-200 resize-none rounded-lg"
                    />
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap gap-2.5 justify-center"
        >
          <Button
            onClick={buildFHIR}
            disabled={!canSubmit || building}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-sm text-sm font-medium"
          >
            {building ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Building...</>
            ) : (
              <><Code className="h-4 w-4" /> Build FHIR Resource</>
            )}
          </Button>
          <Button
            onClick={copyOutput}
            disabled={!output}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-gray-200 dark:border-gray-700"
          >
            {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
          <Button
            onClick={downloadOutput}
            disabled={!output}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-gray-200 dark:border-gray-700"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FHIR Output */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-500 dark:to-gray-700 rounded-t-2xl" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">FHIR DocumentReference Output</span>
              </div>
              {output && (
                <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px]">
                  <CheckCircle className="h-3 w-3 mr-1" /> Generated
                </Badge>
              )}
            </div>
            <pre className="bg-gray-900 dark:bg-gray-950 text-emerald-300 p-4 rounded-xl overflow-auto max-h-80 text-xs font-mono border border-gray-700 dark:border-gray-800">
              {output || '// FHIR DocumentReference JSON will appear here after building...'}
            </pre>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-t-2xl" />
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">How It Works</h3>
          </div>
          <div className="space-y-2.5">
            {[
              { step: 1, text: <>Nurse clicks <span className="font-semibold text-purple-700 dark:text-purple-400">Connect to EHR</span>.</> },
              { step: 2, text: 'Epic login page opens — nurse enters their hospital credentials.' },
              { step: 3, text: 'Epic authenticates and may ask for permission.' },
              { step: 4, text: 'Epic redirects back to ClinicalScribe with authorization code.' },
              { step: 5, text: 'ClinicalScribe exchanges the code for an access token.' },
              { step: 6, text: <>SOAP Note PDF is exported to Epic as a <code className="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded text-xs font-mono">DocumentReference</code>.</> },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold">
                  {item.step}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Connection Lifecycle */}
        <ConnectionLifecycle />
      </div>
    </div>
  )
}
