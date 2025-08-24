// app/ehr-sandbox/page.tsx
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSmartStatus } from '@/hooks/use-smart-status'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import {
  Share2,
  Database,
  FileText,
  Link,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  Sparkles,
  Zap,
  Shield,
  Code
} from 'lucide-react'

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
  
  // 🔥 Get EHR connection status and toast system
  const smartStatus = useSmartStatus()
  const { toast } = useToast()
  const [previousConnectionStatus, setPreviousConnectionStatus] = useState<boolean | null>(null)

  // 🎯 Toast notification when EHR connection status changes
  useEffect(() => {
    if (previousConnectionStatus !== null && previousConnectionStatus !== smartStatus.connected) {
      if (smartStatus.connected) {
        toast({
          title: "🟢 EHR Connected!",
          description: "Successfully connected to Epic SMART on FHIR. You can now export clinical data.",
        })
      } else {
        toast({
          title: "🔴 EHR Disconnected",
          description: "Connection to EHR has been lost. Please reconnect if needed.",
        })
      }
    }
    setPreviousConnectionStatus(smartStatus.connected)
  }, [smartStatus.connected, previousConnectionStatus, toast])

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

  // 🚀 Safe EHR connection handler - opens in new tab
  const handleConnectToEHR = () => {
    const SMART_AUTH_URL = `/smart/launch/default`
    // Open Epic SMART login in new tab, keeping your app open
    window.open(SMART_AUTH_URL, "_blank", "noopener,noreferrer")
    
    // Show immediate feedback
    toast({
      title: "🔗 Opening EHR Connection...",
      description: "Epic SMART login opened in new tab. Complete login to connect.",
    })
  }

  const parsedExample = tryParseJSON(output)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-300/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl shadow-2xl ring-4 ring-emerald-200/50">
                <Share2 className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-900 bg-clip-text text-transparent drop-shadow-sm">
                EHR Integration Sandbox
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                  <Database className="h-3 w-3 mr-1" />
                  FHIR R4
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                  <Shield className="h-3 w-3 mr-1" />
                  SMART on FHIR
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                  <Code className="h-3 w-3 mr-1" />
                  Developer
                </Badge>
              </div>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            Build and test FHIR DocumentReference resources with 
            <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">enterprise-grade EHR integration</span>
          </motion.p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-teal-400/10 to-cyan-400/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Header with Connection Status */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl ring-2 ring-white/30"
                  >
                    <Database className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-black text-white">FHIR Integration Sandbox</h3>
                    <p className="text-emerald-100 font-medium">Build and test EHR DocumentReference resources</p>
                  </div>
                </div>
                
                {/* Connection Status */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleConnectToEHR}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all duration-300 hover:scale-105 ${
                      smartStatus.connected 
                        ? 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30' 
                        : 'bg-white text-emerald-700 hover:bg-gray-50'
                    }`}
                  >
                    {smartStatus.connected ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        EHR Connected
                      </>
                    ) : (
                      <>
                        <Link className="h-5 w-5" />
                        Connect to EHR
                      </>
                    )}
                  </Button>
                  
                  {smartStatus.connected && (
                    <Badge className="bg-emerald-500/20 text-white border-white/30 px-4 py-2 text-sm font-bold">
                      <Zap className="h-4 w-4 mr-1" />
                      Ready for Export
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Input Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Metadata */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                    <h4 className="font-black text-blue-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Metadata
                    </h4>
                    <div className="space-y-4">
                      <Input 
                        placeholder="Patient name (optional)" 
                        value={patientName} 
                        onChange={(e) => setPatientName(e.target.value)}
                        className="h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500"
                      />
                      <Input 
                        placeholder="Encounter type (e.g., Office visit)" 
                        value={encounterType} 
                        onChange={(e) => setEncounterType(e.target.value)}
                        className="h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500"
                      />
                      <Input 
                        placeholder="Author name (optional)" 
                        value={authorName} 
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500"
                      />
                      <Input 
                        placeholder="Attachment URL (HTML/PDF optional)" 
                        value={attachmentUrl} 
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Right Column - SOAP Content */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                    <h4 className="font-black text-emerald-900 mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      SOAP Note Content
                    </h4>
                    <div className="space-y-4">
                      {[
                        { label: 'Subjective', value: subjective, setter: setSubjective, color: 'emerald' },
                        { label: 'Objective', value: objective, setter: setObjective, color: 'blue' },
                        { label: 'Assessment', value: assessment, setter: setAssessment, color: 'purple' },
                        { label: 'Plan', value: plan, setter: setPlan, color: 'orange' }
                      ].map((section) => (
                        <div key={section.label} className="space-y-2">
                          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span className={`w-3 h-3 bg-${section.color}-500 rounded-full`}></span>
                            {section.label}
                          </label>
                          <Textarea 
                            placeholder={section.label} 
                            rows={3} 
                            value={section.value} 
                            onChange={(e) => section.setter(e.target.value)}
                            className={`rounded-xl border-2 border-${section.color}-200 focus:border-${section.color}-500 resize-none`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  onClick={buildFHIR} 
                  disabled={!canSubmit}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white rounded-2xl shadow-xl hover:shadow-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  <Code className="h-5 w-5" />
                  Build FHIR Resource
                </Button>
                <Button 
                  onClick={copyOutput} 
                  disabled={!output}
                  className="flex items-center gap-2 px-6 py-4 bg-white text-emerald-700 border-2 border-emerald-200 hover:border-emerald-300 rounded-2xl shadow-lg hover:shadow-xl font-bold transition-all duration-300 hover:scale-105"
                >
                  <Copy className="h-4 w-4" />
                  Copy JSON
                </Button>
                <Button 
                  onClick={downloadOutput} 
                  disabled={!output}
                  className="flex items-center gap-2 px-6 py-4 bg-white text-blue-700 border-2 border-blue-200 hover:border-blue-300 rounded-2xl shadow-lg hover:shadow-xl font-bold transition-all duration-300 hover:scale-105"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">{error}</span>
                </motion.div>
              )}

              <Separator className="my-8" />

              {/* Output Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-black text-gray-900">FHIR DocumentReference Output</h4>
                  {output && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Generated
                    </Badge>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl opacity-95 group-hover:opacity-100 transition-opacity duration-300" />
                  <pre className="relative bg-gray-900 text-green-300 p-6 rounded-2xl overflow-auto max-h-96 text-sm font-mono border-2 border-gray-700 shadow-inner">
                    {output || '// FHIR DocumentReference JSON will appear here after building...'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
