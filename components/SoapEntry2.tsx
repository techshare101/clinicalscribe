'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit, doc, updateDoc } from 'firebase/firestore'
import { 
  Save, 
  User, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Stethoscope,
  Eye,
  Brain,
  Clipboard,
  AlertTriangle,
  Sparkles,
  Copy,
  Loader2,
  Gauge,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BodyMap from '@/components/body-map/BodyMap'
import { usePatientsSearch } from '@/hooks/use-patients-search'
import { renderAndUploadPDF } from '@/lib/pdf'
import { toast } from '@/lib/toast'
import { formatDate } from '@/lib/formatDate'

interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  painLevel: string
  uid?: string
  createdAt?: any
  patientName?: string
  patientId?: string
  encounterType?: string
  fhirExport?: { status: 'none' | 'ready' | 'posting' | 'success' | 'error'; lastAt?: any; detail?: string }
}

interface GPTAnalysis {
  flagged: boolean
  feedback: string
  recommendation: string
}

const ENCOUNTER_PRESETS = [
  { label: 'Initial Visit', value: 'Initial Visit' },
  { label: 'Follow-Up', value: 'Follow-Up' },
  { label: 'Adjustment', value: 'Chiropractic Adjustment' },
  { label: 'Deep Tissue', value: 'Deep Tissue Massage' },
  { label: 'Sports Massage', value: 'Sports Massage' },
  { label: 'Yoga Session', value: 'Yoga Therapy Session' },
  { label: 'PT Eval', value: 'Physical Therapy Evaluation' },
  { label: 'Rehab', value: 'Rehabilitation Session' },
  { label: 'Wellness Check', value: 'Wellness Assessment' },
]

const SOAP_SECTIONS = [
  {
    key: 'subjective' as const,
    letter: 'S',
    label: 'Subjective',
    icon: Eye,
    color: 'blue',
    description: "Client's own words — what they report feeling",
    placeholder: 'e.g. Client reports sharp pain in left shoulder when reaching overhead. Pain began 3 days ago after gardening. Rates discomfort as 7/10.',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    letterBg: 'bg-blue-200 text-blue-800',
  },
  {
    key: 'objective' as const,
    letter: 'O',
    label: 'Objective',
    icon: Stethoscope,
    color: 'emerald',
    description: "Your observations — palpation, ROM, posture findings",
    placeholder: 'e.g. Posture shows forward head and rounded shoulders. Limited active ROM in cervical spine. Palpation reveals tenderness and trigger points in left trapezius.',
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-800',
    letterBg: 'bg-emerald-200 text-emerald-800',
  },
  {
    key: 'assessment' as const,
    letter: 'A',
    label: 'Assessment',
    icon: Brain,
    color: 'amber',
    description: "Clinical interpretation — diagnosis or working hypothesis",
    placeholder: 'e.g. Myofascial pain syndrome in left trapezius. Restricted cervical mobility contributing to symptoms. Postural dysfunction noted.',
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    letterBg: 'bg-amber-200 text-amber-800',
  },
  {
    key: 'plan' as const,
    letter: 'P',
    label: 'Plan',
    icon: Clipboard,
    color: 'indigo',
    description: "Treatment plan — what you'll do and next steps",
    placeholder: 'e.g. Apply trigger point therapy to trapezius 2x/week for 3 weeks. Prescribe cervical mobility exercises. Home stretching routine. Reassess in 2 weeks.',
    borderColor: 'border-l-indigo-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-800',
    letterBg: 'bg-indigo-200 text-indigo-800',
  },
]

export default function SoapEntry2() {
  const [user, setUser] = useState<any>(null)
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [painLevel, setPainLevel] = useState('')
  const [encounterType, setEncounterType] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState<string | undefined>(undefined)
  const { results: patientSuggestions } = usePatientsSearch(patientName)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [gptAnalysis, setGptAnalysis] = useState<GPTAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const soapValues = { subjective, objective, assessment, plan }
  const setters = {
    subjective: setSubjective,
    objective: setObjective,
    assessment: setAssessment,
    plan: setPlan,
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null)
    })
    return () => unsubscribe()
  }, [])

  const validateForm = () => {
    if (!subjective.trim()) { setError('Subjective section is required'); return false }
    if (!objective.trim()) { setError('Objective section is required'); return false }
    if (!assessment.trim()) { setError('Assessment section is required'); return false }
    if (!plan.trim()) { setError('Plan section is required'); return false }
    if (painLevel && (parseInt(painLevel) < 0 || parseInt(painLevel) > 10)) {
      setError('Pain level must be between 0 and 10'); return false
    }
    return true
  }

  const analyzeWithGPT = async () => {
    if (!subjective && !objective && !assessment && !plan) return
    setIsAnalyzing(true)
    setError(null)
    try {
      const response = await fetch('/api/redflag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soapNote: {
            subjective: subjective.trim(),
            objective: objective.trim(),
            assessment: assessment.trim(),
            plan: plan.trim(),
            painLevel: painLevel.trim(),
          },
        }),
      })
      if (!response.ok) throw new Error('Failed to analyze')
      const result: GPTAnalysis = await response.json()
      setGptAnalysis(result)
    } catch (err) {
      console.error('Error analyzing SOAP note:', err)
      setError('Failed to analyze SOAP note. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) { setError('You must be logged in to save SOAP notes'); return }
    if (!validateForm()) return

    setIsSaving(true)
    setError(null)
    setSaveStatus('idle')

    try {
      let resolvedPatientId = patientId
      const trimmedName = (patientName || '').trim()
      if (!resolvedPatientId && trimmedName) {
        const lower = trimmedName.toLowerCase()
        const patientsRef = collection(db, 'patients')
        const snap = await getDocs(query(patientsRef, where('name_lower', '==', lower), limit(1)))
        if (!snap.empty) {
          resolvedPatientId = snap.docs[0].id
        } else {
          const newDoc = await addDoc(patientsRef, {
            name: trimmedName,
            name_lower: lower,
            ownerId: user.uid,
          })
          resolvedPatientId = newDoc.id
        }
      }

      const soapNote: SOAPNote = {
        subjective: subjective.trim(),
        objective: objective.trim(),
        assessment: assessment.trim(),
        plan: plan.trim(),
        painLevel: painLevel.trim(),
        encounterType: encounterType.trim() || undefined,
        uid: user.uid,
        createdAt: serverTimestamp(),
        patientName: trimmedName || undefined,
        patientId: resolvedPatientId,
        fhirExport: { status: 'none' },
      }

      const docRef = await addDoc(collection(db, 'soapNotes'), soapNote)

      // Render and upload PDF
      try {
        await updateDoc(doc(db, 'soapNotes', docRef.id), { pdf: { status: 'pending' } })
        const html = `
          <h1>SOAP Note</h1>
          <p><strong>Date:</strong> ${formatDate(new Date())}</p>
          <p><strong>Client:</strong> ${trimmedName || 'Unknown'}</p>
          <p><strong>Session:</strong> ${encounterType || 'General'}</p>
          <p><strong>Pain Level:</strong> ${painLevel || 'N/A'}</p>
          <h2>Subjective</h2><div>${subjective.replace(/\n/g, '<br/>')}</div>
          <h2>Objective</h2><div>${objective.replace(/\n/g, '<br/>')}</div>
          <h2>Assessment</h2><div>${assessment.replace(/\n/g, '<br/>')}</div>
          <h2>Plan</h2><div>${plan.replace(/\n/g, '<br/>')}</div>
        `
        const { path } = await renderAndUploadPDF(html, user.uid, docRef.id, 'ClinicalScribe Beta')
        await updateDoc(doc(db, 'soapNotes', docRef.id), { storagePath: path, pdf: { status: 'done', path } })
        toast({ message: 'PDF generated and saved', variant: 'success' })
      } catch (e) {
        console.error('PDF generation failed', e)
        await updateDoc(doc(db, 'soapNotes', docRef.id), { pdf: { status: 'error' } }).catch(() => {})
        toast({ message: 'PDF generation failed', variant: 'error' })
      }

      setSaveStatus('success')
      setSubjective(''); setObjective(''); setAssessment(''); setPlan('')
      setPainLevel(''); setEncounterType(''); setPatientName(''); setPatientId(undefined)
      setGptAnalysis(null)
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error saving SOAP note:', err)
      setError('Failed to save SOAP note. Please try again.')
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const exportSOAP = () => {
    const fullSOAP = `SOAP NOTE\nDate: ${formatDate(new Date())}\nClient: ${patientName || 'N/A'}\nSession: ${encounterType || 'N/A'}\nPain Level: ${painLevel || 'Not recorded'}\n\nSUBJECTIVE:\n${subjective}\n\nOBJECTIVE:\n${objective}\n\nASSESSMENT:\n${assessment}\n\nPLAN:\n${plan}`
    const blob = new Blob([fullSOAP], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SOAP_Note_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const painNum = parseInt(painLevel) || 0
  const painColor = painNum <= 3 ? 'emerald' : painNum <= 6 ? 'amber' : 'red'

  return (
    <div className="space-y-4">
      {/* Client & Session Info */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-t-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <User className="h-3.5 w-3.5" /> Client / Patient
            </label>
            <div className="relative">
              <Input
                placeholder="Search or enter name"
                className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                value={patientName}
                onChange={(e) => { setPatientName(e.target.value); setPatientId(undefined) }}
              />
              {patientId && (
                <button
                  onClick={() => setPatientId(undefined)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
              {!patientId && patientName.trim().length >= 2 && patientSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-40 overflow-y-auto">
                  {patientSuggestions.map((p: { id: string; name: string; mrn?: string }) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm transition-colors"
                      onClick={() => { setPatientName(p.name); setPatientId(p.id) }}
                    >
                      <span className="font-medium text-gray-900">{p.name}</span>
                      {p.mrn && <span className="text-[10px] text-gray-400 ml-2">MRN: {p.mrn}</span>}
                    </button>
                  ))}
                </div>
              )}
              {patientId && (
                <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Linked to patient record</p>
              )}
            </div>
          </div>

          {/* Encounter Type */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <Stethoscope className="h-3.5 w-3.5" /> Session Type
            </label>
            <Input
              placeholder="e.g. Initial Visit, Deep Tissue..."
              className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
              value={encounterType}
              onChange={(e) => setEncounterType(e.target.value)}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {ENCOUNTER_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setEncounterType(preset.value)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    encounterType === preset.value
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pain Level */}
        <div className="mt-4 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <Gauge className="h-3.5 w-3.5" /> Pain / Discomfort Level (0–10)
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="0"
              max="10"
              value={painLevel}
              onChange={(e) => setPainLevel(e.target.value)}
              placeholder="0-10"
              className="h-9 text-sm bg-gray-50 border-gray-200 w-24 focus:border-emerald-300 focus:ring-emerald-200"
            />
            {painLevel && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPainLevel(String(i + 1))}
                      className={`w-5 h-5 rounded text-[9px] font-bold transition-all ${
                        i + 1 <= painNum
                          ? i + 1 <= 3 ? 'bg-emerald-500 text-white' : i + 1 <= 6 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Badge className={`text-[10px] ${
                  painColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : painColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {painNum <= 3 ? 'Mild' : painNum <= 6 ? 'Moderate' : 'Severe'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body Map */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-2xl" />
        <div className="p-5">
          <BodyMap />
        </div>
      </div>

      {/* SOAP Sections */}
      <div className="space-y-3">
        {SOAP_SECTIONS.map((section) => (
          <div key={section.key} className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full ${section.borderColor}`} />
            <div className="p-4 pl-5">
              {/* Section header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${section.letterBg}`}>
                    {section.letter}
                  </span>
                  <h3 className={`text-sm font-semibold ${section.textColor}`}>{section.label}</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(soapValues[section.key], section.key)}
                  disabled={!soapValues[section.key]}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors p-1"
                  title="Copy to clipboard"
                >
                  {copiedField === section.key ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mb-2.5 ml-8">{section.description}</p>
              <Textarea
                value={soapValues[section.key]}
                onChange={(e) => setters[section.key](e.target.value)}
                placeholder={section.placeholder}
                className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:border-gray-300 resize-y"
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Clinical Analysis */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-2xl" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Sparkles className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI Clinical Analysis</h3>
              <p className="text-[11px] text-gray-500">Red flag detection & clinical insights powered by GPT-4o</p>
            </div>
          </div>

          <Button
            onClick={analyzeWithGPT}
            disabled={isAnalyzing || (!subjective && !objective && !assessment && !plan)}
            variant="outline"
            size="sm"
            className="mt-3 w-full border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg h-9 text-xs"
          >
            {isAnalyzing ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Analyze with GPT-4o</>
            )}
          </Button>

          <AnimatePresence>
            {gptAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mt-3 p-3.5 rounded-xl border text-sm ${
                  gptAnalysis.flagged
                    ? 'bg-red-50 border-red-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {gptAnalysis.flagged ? (
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold text-xs ${gptAnalysis.flagged ? 'text-red-800' : 'text-emerald-800'}`}>
                      {gptAnalysis.flagged ? 'Clinical Alert Detected' : 'No Critical Issues Found'}
                    </p>
                    <p className={`mt-1 text-xs leading-relaxed ${gptAnalysis.flagged ? 'text-red-700' : 'text-emerald-700'}`}>
                      {gptAnalysis.feedback}
                    </p>
                    {gptAnalysis.flagged && gptAnalysis.recommendation && (
                      <div className="mt-2 p-2.5 bg-red-100 rounded-lg">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-red-800 mb-0.5">Recommendation</p>
                        <p className="text-xs text-red-700">{gptAnalysis.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error / Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm"
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>Session note saved successfully! PDF will be available in SOAP History.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <Button
          onClick={handleSubmit}
          disabled={isSaving || !user}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-10 text-sm font-medium shadow-sm"
        >
          {isSaving ? (
            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving & Generating PDF...</>
          ) : (
            <><Save className="mr-1.5 h-4 w-4" /> Save Session Note</>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={exportSOAP}
          disabled={!subjective && !objective && !assessment && !plan}
          className="flex-1 rounded-xl h-10 text-sm border-gray-200"
        >
          <FileText className="mr-1.5 h-4 w-4" /> Export as Text
        </Button>
      </div>
    </div>
  )
}
