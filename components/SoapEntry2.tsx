'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore'
import { 
  Save, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Stethoscope,
  Eye,
  Brain,
  Clipboard,
  AlertTriangle,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BodyMap from '@/components/body-map/BodyMap'
import { usePatientsSearch } from '@/hooks/use-patients-search'

interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  painLevel: string
  userId?: string
  createdAt?: any
  patientName?: string
  patientId?: string
  fhirExport?: { status: 'none' | 'ready' | 'posting' | 'success' | 'error'; lastAt?: any; detail?: string }
}

interface GPTAnalysis {
  flagged: boolean
  feedback: string
  recommendation: string
}

export default function SoapEntry2() {
  const [user, setUser] = useState<any>(null)
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [painLevel, setPainLevel] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState<string | undefined>(undefined)
  const { results: patientSuggestions } = usePatientsSearch(patientName)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [gptAnalysis, setGptAnalysis] = useState<GPTAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  const validateForm = () => {
    if (!subjective.trim()) {
      setError('Subjective section is required')
      return false
    }
    if (!objective.trim()) {
      setError('Objective section is required')
      return false
    }
    if (!assessment.trim()) {
      setError('Assessment section is required')
      return false
    }
    if (!plan.trim()) {
      setError('Plan section is required')
      return false
    }
    if (painLevel && (parseInt(painLevel) < 0 || parseInt(painLevel) > 10)) {
      setError('Pain level must be between 0 and 10')
      return false
    }
    return true
  }

  const analyzeWithGPT = async () => {
    if (!subjective && !objective && !assessment && !plan) {
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const soapNote = {
        subjective: subjective.trim(),
        objective: objective.trim(),
        assessment: assessment.trim(),
        plan: plan.trim(),
        painLevel: painLevel.trim()
      }

      const response = await fetch('/api/redflag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ soapNote }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze SOAP note')
      }

      const result: GPTAnalysis = await response.json()
      setGptAnalysis(result)
    } catch (err) {
      console.error('Error analyzing SOAP note:', err)
      setError('Failed to analyze SOAP note with GPT. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to save SOAP notes')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setError(null)
    setSaveStatus('idle')

    try {
      // Resolve patientId if only name provided: find or create minimal patient record
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
        userId: user.uid,
        createdAt: serverTimestamp(),
        patientName: trimmedName || undefined,
        patientId: resolvedPatientId,
        fhirExport: { status: 'none' }
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'soapNotes'), soapNote)
      console.log('SOAP Note saved with ID:', docRef.id)

      setSaveStatus('success')

      // Reset form after successful save
      setSubjective('')
      setObjective('')
      setAssessment('')
      setPlan('')
      setPainLevel('')
      setPatientName('')
      setPatientId(undefined)
      setGptAnalysis(null)

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error saving SOAP note:', err)
      setError('Failed to save SOAP note. Please try again.')
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const exportSOAP = () => {
    const fullSOAP = `SOAP NOTE
Date: ${new Date().toLocaleDateString()}

PAIN LEVEL: ${painLevel || 'Not recorded'}

SUBJECTIVE:
${subjective}

OBJECTIVE:
${objective}

ASSESSMENT:
${assessment}

PLAN:
${plan}`

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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">SOAP Entry 2.0</h1>
          <p className="text-gray-600">Document patient encounters with structured clinical notes</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Stethoscope className="h-4 w-4 mr-1" />
          Clinical Documentation
        </Badge>
      </div>

      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="h-5 w-5" />
            New SOAP Note
          </CardTitle>
          <CardDescription>
            Fill in each section to create a comprehensive clinical documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <User className="h-4 w-4" />
                Patient
              </label>
              <div className="relative">
                <Input
                  placeholder="Search or enter patient name"
                  className="bg-white pr-24"
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value)
                    setPatientId(undefined) // reset selection when typing
                  }}
                />
                {patientId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-1 top-1"
                    onClick={() => setPatientId(undefined)}
                  >
                    Clear
                  </Button>
                ) : null}
                {/* Suggestions dropdown */}
                {!patientId && patientName.trim().length >= 2 && patientSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow">
                    {patientSuggestions.map((p: { id: string; name: string; mrn?: string }) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100"
                        onClick={() => {
                          setPatientName(p.name)
                          setPatientId(p.id)
                        }}
                      >
                        <div className="font-medium">{p.name}</div>
                        {p.mrn && <div className="text-xs text-gray-500">MRN: {p.mrn}</div>}
                      </button>
                    ))}
                  </div>
                )}
                {patientId && (
                  <div className="mt-1 text-xs text-gray-600">Selected patient ID: {patientId}</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                Encounter Type
              </label>
              <Input
                placeholder="e.g., Initial Visit, Follow-up"
                className="bg-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-gray-700">
              Pain Level (0–10)
            </label>
            <Input
              type="number"
              min="0"
              max="10"
              value={painLevel}
              onChange={(e) => setPainLevel(e.target.value)}
              placeholder="Enter pain level (0-10)"
              className="bg-white"
            />
          </div>

          {/* Body Map Section */}
          <BodyMap />

          <div className="space-y-4">
            {/* Subjective Section */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-blue-900">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Subjective
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(subjective)}
                    disabled={!subjective}
                  >
                    <span className="text-xs">Copy</span>
                  </Button>
                </CardTitle>
                <CardDescription>Patient's own words and perspective</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  placeholder="e.g. Client reports sharp pain in left shoulder when reaching overhead. Pain began 3 days ago after gardening."
                  className="min-h-[120px] bg-white"
                />
              </CardContent>
            </Card>

            {/* Objective Section */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-green-900">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Objective
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(objective)}
                    disabled={!objective}
                  >
                    <span className="text-xs">Copy</span>
                  </Button>
                </CardTitle>
                <CardDescription>Clinician's observations and measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Posture shows forward head and rounded shoulders. Limited active ROM in cervical spine. Palpation reveals tenderness in left trapezius."
                  className="min-h-[120px] bg-white"
                />
              </CardContent>
            </Card>

            {/* Assessment Section */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-orange-900">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Assessment
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(assessment)}
                    disabled={!assessment}
                  >
                    <span className="text-xs">Copy</span>
                  </Button>
                </CardTitle>
                <CardDescription>Clinician's interpretation and diagnosis</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="e.g. Myofascial pain syndrome in left trapezius. Restricted cervical mobility contributing to symptoms. Postural dysfunction."
                  className="min-h-[120px] bg-white"
                />
              </CardContent>
            </Card>

            {/* Plan Section */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-purple-900">
                  <div className="flex items-center gap-2">
                    <Clipboard className="h-4 w-4" />
                    Plan
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(plan)}
                    disabled={!plan}
                  >
                    <span className="text-xs">Copy</span>
                  </Button>
                </CardTitle>
                <CardDescription>Treatment approach and follow-up</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="e.g. Apply trigger point therapy to trapezius 2x/week for 3 weeks. Prescribe cervical mobility exercises. Reassess in 2 weeks."
                  className="min-h-[120px] bg-white"
                />
              </CardContent>
            </Card>
          </div>

          {/* GPT-4o Analysis Section */}
          <Card className="border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Sparkles className="h-5 w-5" />
                AI Clinical Analysis
              </CardTitle>
              <CardDescription>
                GPT-4o powered red flag detection and clinical insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={analyzeWithGPT}
                  disabled={isAnalyzing || (!subjective && !objective && !assessment && !plan)}
                  variant="outline"
                  className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze with GPT-4o
                    </>
                  )}
                </Button>
              </div>

              {gptAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    gptAnalysis.flagged 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {gptAnalysis.flagged ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${
                        gptAnalysis.flagged ? 'text-red-800' : 'text-green-800'
                      }`}>
                        {gptAnalysis.flagged 
                          ? '⚠️ Clinical Alert Detected' 
                          : '✅ No Critical Issues Found'}
                      </h3>
                      <p className={`mt-1 text-sm ${
                        gptAnalysis.flagged ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {gptAnalysis.feedback}
                      </p>
                      {gptAnalysis.flagged && gptAnalysis.recommendation && (
                        <div className="mt-2 p-3 bg-red-100 rounded-md">
                          <p className="text-sm font-medium text-red-800">Recommendation:</p>
                          <p className="text-sm text-red-700">{gptAnalysis.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">SOAP note saved successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={isSaving || !user}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save SOAP Note
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={exportSOAP}
              disabled={!subjective && !objective && !assessment && !plan}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export as Text
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}