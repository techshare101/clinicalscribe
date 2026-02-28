'use client'

import { useState, useEffect, useMemo } from 'react'
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
  MapPin,
  Target,
} from 'lucide-react'
import type { Discipline } from '@/app/soap-entry/page'
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

function getEncounterPresets(discipline: Discipline) {
  const common = [
    { label: 'Initial Visit', value: 'Initial Visit' },
    { label: 'Follow-Up', value: 'Follow-Up' },
  ]
  const byDiscipline: Record<string, { label: string; value: string }[]> = {
    general: [
      { label: 'Adjustment', value: 'Chiropractic Adjustment' },
      { label: 'Deep Tissue', value: 'Deep Tissue Massage' },
      { label: 'Yoga Session', value: 'Yoga Therapy Session' },
      { label: 'PT Eval', value: 'Physical Therapy Evaluation' },
      { label: 'Wellness Check', value: 'Wellness Assessment' },
    ],
    chiropractic: [
      { label: 'Adjustment', value: 'Chiropractic Adjustment' },
      { label: 'Spinal Screen', value: 'Spinal Screening' },
      { label: 'Re-Exam', value: 'Progress Re-Examination' },
      { label: 'Maintenance', value: 'Maintenance Visit' },
      { label: 'X-Ray Review', value: 'X-Ray Review' },
    ],
    massage: [
      { label: 'Deep Tissue', value: 'Deep Tissue Massage' },
      { label: 'Sports', value: 'Sports Massage' },
      { label: 'Swedish', value: 'Swedish Massage' },
      { label: 'Prenatal', value: 'Prenatal Massage' },
      { label: 'Trigger Point', value: 'Trigger Point Therapy' },
    ],
    yoga: [
      { label: 'Yoga Therapy', value: 'Yoga Therapy Session' },
      { label: 'Private', value: 'Private Yoga Session' },
      { label: 'Group Assess', value: 'Group Assessment' },
      { label: 'Breathwork', value: 'Breathwork Session' },
      { label: 'Mobility', value: 'Mobility & Flexibility' },
    ],
    pt: [
      { label: 'PT Eval', value: 'Physical Therapy Evaluation' },
      { label: 'Rehab', value: 'Rehabilitation Session' },
      { label: 'Post-Op', value: 'Post-Operative Rehab' },
      { label: 'Gait Analysis', value: 'Gait Analysis' },
      { label: 'Discharge', value: 'Discharge Evaluation' },
    ],
    clinical: [
      { label: 'Triage', value: 'Triage Assessment' },
      { label: 'Rounds', value: 'Patient Rounds' },
      { label: 'Discharge', value: 'Discharge Summary' },
      { label: 'Consult', value: 'Consultation' },
      { label: 'Procedure', value: 'Procedure Note' },
    ],
  }
  return [...common, ...(byDiscipline[discipline] || byDiscipline.general)]
}

const SECTION_COPY: Record<string, { description: Record<string, string>; placeholder: Record<string, string> }> = {
  subjective: {
    description: {
      general: "Client's own words — what they report feeling",
      chiropractic: "Patient's reported symptoms — pain location, onset, aggravating factors",
      massage: "Client's goals for this session — areas of tension, pain, or stress",
      yoga: "Client's current state — energy level, areas of tightness, recent activity",
      pt: "Patient's functional complaints — pain, limitations, progress since last visit",
      clinical: "Patient's chief complaint — history of present illness in their own words",
    },
    placeholder: {
      general: 'e.g. Client reports sharp pain in left shoulder when reaching overhead. Pain began 3 days ago. Rates discomfort 7/10.',
      chiropractic: 'e.g. Patient reports low back pain radiating to left leg, worse after sitting >30 min. Onset 1 week ago lifting furniture. Pain 6/10.',
      massage: 'e.g. Client requests focus on upper back and neck tension. Reports stress-related tightness, difficulty sleeping. Rates tension 8/10.',
      yoga: 'e.g. Client reports tight hamstrings and hip flexors limiting forward folds. Recent increase in running. Energy level moderate.',
      pt: 'e.g. Patient reports improved knee flexion since last visit. Still has difficulty with stairs. Pain 4/10 down from 7/10 at initial eval.',
      clinical: 'e.g. Patient presents with 3-day history of productive cough, low-grade fever 100.2F. Reports fatigue and body aches.',
    },
  },
  objective: {
    description: {
      general: 'Your observations — palpation, ROM, posture findings',
      chiropractic: 'Include spinal palpation, ROM, orthopedic tests, subluxation findings',
      massage: 'Include tissue quality, trigger points, adhesions, postural observations',
      yoga: 'Include ROM assessment, alignment observations, breath patterns',
      pt: 'Include ROM measurements, strength testing (MMT), functional tests, gait',
      clinical: 'Include vitals, physical exam findings, relevant lab/imaging results',
    },
    placeholder: {
      general: 'e.g. Posture shows forward head and rounded shoulders. Limited active ROM in cervical spine. Palpation reveals tenderness in left trapezius.',
      chiropractic: 'e.g. T4-T6 fixation noted on motion palpation. Positive Kemp\'s test left. Cervical ROM: flexion 40° (N=50°). Paravertebral muscle spasm bilateral.',
      massage: 'e.g. Hypertonic tissue noted in bilateral upper trapezius. Active trigger point left levator scapulae. Adhesion present in right IT band. Forward head posture.',
      yoga: 'e.g. Forward fold limited to mid-shin. Hip external rotation restricted bilaterally. Breath shallow, chest-dominant pattern. Shoulder elevation during movement.',
      pt: 'e.g. Knee flexion AROM 110° (goal 130°). Quad strength 4/5 MMT. Single leg stance 15 sec (N=30). Gait: antalgic pattern, decreased stance phase right.',
      clinical: 'e.g. T 100.4F, HR 88, BP 128/82, RR 18, SpO2 97%. Lungs: bilateral rhonchi, decreased breath sounds right base. No wheezing.',
    },
  },
  assessment: {
    description: {
      general: 'Clinical interpretation — diagnosis or working hypothesis',
      chiropractic: 'Diagnosis — subluxation complex, differential, clinical impression',
      massage: 'Clinical impression — primary dysfunction, contributing factors',
      yoga: 'Movement assessment — imbalances, compensations, priorities',
      pt: 'Diagnosis & prognosis — ICD code, functional limitations, rehab potential',
      clinical: 'Assessment — differential diagnosis, problem list, clinical reasoning',
    },
    placeholder: {
      general: 'e.g. Myofascial pain syndrome in left trapezius. Restricted cervical mobility contributing to symptoms. Postural dysfunction.',
      chiropractic: 'e.g. Thoracic segmental dysfunction T4-T6. Cervical radiculopathy left C5-C6. Postural syndrome with upper crossed pattern.',
      massage: 'e.g. Upper crossed syndrome with chronic tension in cervicothoracic region. Myofascial trigger points contributing to referral pain pattern.',
      yoga: 'e.g. Posterior chain tightness limiting hip hinge mechanics. Compensatory lumbar flexion during forward folds. Breath pattern dysfunction.',
      pt: 'e.g. S/P right TKA 4 weeks. Progressing well. Limited knee flexion and quad weakness. Good rehab potential for full functional recovery.',
      clinical: 'e.g. 1. Community-acquired pneumonia, right lower lobe. 2. Dehydration, mild. 3. Hypertension, controlled.',
    },
  },
  plan: {
    description: {
      general: "Treatment plan — what you'll do and next steps",
      chiropractic: 'Adjustment plan — technique, frequency, home exercises, referrals',
      massage: 'Treatment plan — techniques used, home care, follow-up schedule',
      yoga: 'Practice plan — prescribed poses, breathwork, frequency, modifications',
      pt: 'Treatment plan — interventions, HEP, goals, visit frequency, discharge criteria',
      clinical: 'Plan — orders, medications, referrals, follow-up, patient education',
    },
    placeholder: {
      general: 'e.g. Apply trigger point therapy 2x/week for 3 weeks. Prescribe cervical mobility exercises. Reassess in 2 weeks.',
      chiropractic: 'e.g. Diversified adjustment T4-T6 and cervical spine. Cox flexion-distraction L4-L5. E-stim 15 min. 2x/week for 4 weeks, then re-eval. Home: cat-cow stretch 2x/day.',
      massage: 'e.g. 60-min session: myofascial release upper back, trigger point therapy levator scap, Swedish effleurage for relaxation. Home: tennis ball self-release, heat 15 min daily. Rebook 2 weeks.',
      yoga: 'e.g. Prescribe hip opener sequence (pigeon, lizard, 90/90) 3x/week. Diaphragmatic breathing 5 min daily. Modify forward folds with bent knees. Reassess in 4 sessions.',
      pt: 'e.g. Continue quad strengthening (SLR, mini squats, step-ups). Add stationary bike 15 min. Progress to single leg balance. HEP updated. 2x/week, reassess in 2 weeks. Goal: 130° flexion by week 8.',
      clinical: 'e.g. 1. Start azithromycin 500mg day 1, then 250mg x4 days. 2. IV fluids 1L NS bolus. 3. Chest X-ray PA/lateral. 4. Follow up 48-72 hrs. 5. Return precautions reviewed.',
    },
  },
}

function getSoapSections(discipline: Discipline) {
  const base = [
    { key: 'subjective' as const, letter: 'S', label: 'Subjective', icon: Eye, borderColor: 'border-l-blue-500', textColor: 'text-blue-800', letterBg: 'bg-blue-200 text-blue-800' },
    { key: 'objective' as const, letter: 'O', label: 'Objective', icon: Stethoscope, borderColor: 'border-l-emerald-500', textColor: 'text-emerald-800', letterBg: 'bg-emerald-200 text-emerald-800' },
    { key: 'assessment' as const, letter: 'A', label: 'Assessment', icon: Brain, borderColor: 'border-l-amber-500', textColor: 'text-amber-800', letterBg: 'bg-amber-200 text-amber-800' },
    { key: 'plan' as const, letter: 'P', label: 'Plan', icon: Clipboard, borderColor: 'border-l-indigo-500', textColor: 'text-indigo-800', letterBg: 'bg-indigo-200 text-indigo-800' },
  ]
  return base.map((s) => ({
    ...s,
    description: SECTION_COPY[s.key].description[discipline] || SECTION_COPY[s.key].description.general,
    placeholder: SECTION_COPY[s.key].placeholder[discipline] || SECTION_COPY[s.key].placeholder.general,
  }))
}

const BODY_MAP_COPY: Record<string, { title: string; subtitle: string }> = {
  general: { title: 'Interactive Body Map', subtitle: 'Tap areas to mark pain and discomfort zones — builds visual documentation' },
  chiropractic: { title: 'Pain & Subluxation Map', subtitle: 'Mark spinal segments, pain referral patterns, and areas of dysfunction' },
  massage: { title: 'Tension & Trigger Point Map', subtitle: 'Identify areas of tension, adhesions, and trigger points to guide treatment' },
  yoga: { title: 'Mobility & Restriction Map', subtitle: 'Map areas of tightness, restriction, and imbalance to guide practice' },
  pt: { title: 'Functional Pain Map', subtitle: 'Document pain sites, injury areas, and movement limitations for rehab tracking' },
  clinical: { title: 'Physical Exam Body Map', subtitle: 'Mark areas of concern, tenderness, or abnormal findings from examination' },
}

export default function SoapEntry2({ discipline = 'general' }: { discipline?: Discipline }) {
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

  const encounterPresets = useMemo(() => getEncounterPresets(discipline), [discipline])
  const soapSections = useMemo(() => getSoapSections(discipline), [discipline])
  const bodyMapCopy = BODY_MAP_COPY[discipline] || BODY_MAP_COPY.general

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

      const soapNote: Record<string, any> = {
        subjective: subjective.trim(),
        objective: objective.trim(),
        assessment: assessment.trim(),
        plan: plan.trim(),
        painLevel: painLevel.trim(),
        uid: user.uid,
        createdAt: serverTimestamp(),
        fhirExport: { status: 'none' },
      }
      if (encounterType.trim()) soapNote.encounterType = encounterType.trim()
      if (trimmedName) soapNote.patientName = trimmedName
      if (resolvedPatientId) soapNote.patientId = resolvedPatientId
      if (gptAnalysis) {
        soapNote.aiAnalysis = {
          flagged: gptAnalysis.flagged,
          feedback: gptAnalysis.feedback,
          recommendation: gptAnalysis.recommendation || '',
        }
      }

      const docRef = await addDoc(collection(db, 'soapNotes'), soapNote)

      // Render and upload PDF
      try {
        await updateDoc(doc(db, 'soapNotes', docRef.id), { pdf: { status: 'pending' } })
        const analysisHtml = gptAnalysis ? `
          <h2 style="color: ${gptAnalysis.flagged ? '#dc2626' : '#16a34a'};">AI Clinical Analysis</h2>
          <p><strong>Status:</strong> ${gptAnalysis.flagged ? '⚠ Clinical Alert Detected' : '✓ No Critical Issues Found'}</p>
          <p>${gptAnalysis.feedback}</p>
          ${gptAnalysis.recommendation ? `<p><strong>Recommendation:</strong> ${gptAnalysis.recommendation}</p>` : ''}
        ` : ''
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
          ${analysisHtml}
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
    let fullSOAP = `SOAP NOTE\nDate: ${formatDate(new Date())}\nClient: ${patientName || 'N/A'}\nSession: ${encounterType || 'N/A'}\nPain Level: ${painLevel || 'Not recorded'}\n\nSUBJECTIVE:\n${subjective}\n\nOBJECTIVE:\n${objective}\n\nASSESSMENT:\n${assessment}\n\nPLAN:\n${plan}`
    if (gptAnalysis) {
      fullSOAP += `\n\n--- AI CLINICAL ANALYSIS ---\nStatus: ${gptAnalysis.flagged ? 'CLINICAL ALERT DETECTED' : 'No Critical Issues Found'}\nFeedback: ${gptAnalysis.feedback}`
      if (gptAnalysis.recommendation) {
        fullSOAP += `\nRecommendation: ${gptAnalysis.recommendation}`
      }
    }
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
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-md p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 rounded-t-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-1">
          {/* Client Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-emerald-600" />
              </span>
              Client / Patient
            </label>
            <div className="relative">
              <Input
                placeholder="Search or enter client name..."
                className="h-10 text-sm bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-emerald-400 focus:ring-emerald-200 rounded-lg pl-3 font-medium"
                value={patientName}
                onChange={(e) => { setPatientName(e.target.value); setPatientId(undefined) }}
              />
              {patientId && (
                <button
                  onClick={() => setPatientId(undefined)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
              {!patientId && patientName.trim().length >= 2 && patientSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl max-h-40 overflow-y-auto">
                  {patientSuggestions.map((p: { id: string; name: string; mrn?: string }) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                      onClick={() => { setPatientName(p.name); setPatientId(p.id) }}
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</span>
                      {p.mrn && <span className="text-[10px] text-gray-400 ml-2 bg-gray-100 px-1.5 py-0.5 rounded">MRN: {p.mrn}</span>}
                    </button>
                  ))}
                </div>
              )}
              {patientId && (
                <p className="text-[10px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Linked to patient record
                </p>
              )}
            </div>
          </div>

          {/* Encounter Type */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
              </span>
              Session Type
            </label>
            <Input
              placeholder="e.g. Initial Visit, Deep Tissue..."
              className="h-10 text-sm bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-teal-400 focus:ring-teal-200 rounded-lg pl-3 font-medium"
              value={encounterType}
              onChange={(e) => setEncounterType(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {encounterPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setEncounterType(preset.value)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    encounterType === preset.value
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 border border-gray-200/60 dark:border-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pain Level */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Gauge className="h-3.5 w-3.5 text-amber-600" />
            </span>
            Pain / Discomfort Level
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPainLevel(String(i + 1))}
                  className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                    i + 1 <= painNum
                      ? i + 1 <= 3
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : i + 1 <= 6
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            {painLevel ? (
              <Badge className={`text-[10px] font-bold px-2.5 py-0.5 ${
                painColor === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : painColor === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-300'
                  : 'bg-red-100 text-red-700 border-red-300'
              }`}>
                {painNum <= 3 ? 'Mild' : painNum <= 6 ? 'Moderate' : 'Severe'} — {painLevel}/10
              </Badge>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium">Click to rate</span>
            )}
          </div>
        </div>
      </div>

      {/* Body Map — Primary Differentiator */}
      <div className="bg-white dark:bg-gray-900 border-2 border-cyan-200/60 dark:border-cyan-800/40 rounded-2xl shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-t-2xl" />
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-cyan-100 rounded-xl">
              <Target className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{bodyMapCopy.title}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{bodyMapCopy.subtitle}</p>
            </div>
            <Badge className="ml-auto bg-cyan-50 text-cyan-700 border-cyan-200 text-[9px] font-bold uppercase tracking-wide">
              <MapPin className="h-3 w-3 mr-0.5" /> Interactive
            </Badge>
          </div>
          <BodyMap />
        </div>
      </div>

      {/* SOAP Sections */}
      <div className="space-y-3">
        {soapSections.map((section) => (
          <div key={section.key} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm overflow-hidden relative">
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
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5 ml-8">{section.description}</p>
              <Textarea
                value={soapValues[section.key]}
                onChange={(e) => setters[section.key](e.target.value)}
                placeholder={section.placeholder}
                className="min-h-[100px] text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-gray-300 resize-y"
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Clinical Analysis */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-2xl" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Clinical Analysis</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Red flag detection & clinical insights powered by GPT-4o</p>
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
            className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm"
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
            className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm"
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
