'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SOAPGenerator } from '@/components/SOAPGenerator';
import Recorder from '@/components/Recorder';
import { 
  Stethoscope, 
  FileText, 
  Mic, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const sampleTranscripts = [
  {
    id: 1,
    patient: "John Doe",
    type: "General Consultation",
    transcript: `Patient is a 45-year-old male presenting with chief complaint of lower back pain for the past 2 weeks. Pain started gradually after lifting heavy boxes at work. Describes pain as sharp, 7/10 intensity, worse in the morning and when sitting for long periods. No radiation to legs. No numbness or tingling. Has been taking ibuprofen with minimal relief. No previous history of back problems. Physical examination reveals mild tenderness over L4-L5 region, normal range of motion, negative straight leg raise test bilaterally. Vital signs stable: BP 130/80, HR 72, temp 98.6F. Patient appears comfortable at rest.`
  },
  {
    id: 2,
    patient: "Sarah Johnson",
    type: "Follow-up Visit",
    transcript: `Patient returns for follow-up of hypertension. Reports good compliance with lisinopril 10mg daily. Home blood pressure readings averaging 125/75. No side effects from medication. Denies chest pain, shortness of breath, or palpitations. Diet has improved with reduced sodium intake. Exercise routine includes walking 30 minutes daily. Physical exam shows BP 122/78, HR 68, regular rhythm. Heart sounds normal, no murmurs. Lungs clear bilaterally. No peripheral edema. Patient appears well and motivated to continue current management.`
  },
  {
    id: 3,
    patient: "Michael Chen",
    type: "Urgent Care",
    transcript: `22-year-old male presents with acute onset sore throat and fever for 2 days. Temperature peaked at 101.5F yesterday. Throat pain is severe, difficulty swallowing solids. No cough or runny nose. No recent sick contacts. Physical examination reveals erythematous throat with white exudate on tonsils, tender anterior cervical lymphadenopathy. Temperature 100.8F, other vitals stable. Rapid strep test performed and positive. No allergies to penicillin reported.`
  }
];

export default function SOAPPage() {
  const [selectedTranscript, setSelectedTranscript] = useState('');
  const [selectedRawTranscript, setSelectedRawTranscript] = useState('');
  const [selectedPatientLang, setSelectedPatientLang] = useState('');
  const [selectedDocLang, setSelectedDocLang] = useState('');
  const [manualTranscript, setManualTranscript] = useState(''); // For manual entry
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [restored, setRestored] = useState(false); // Track if data was restored

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("manualSOAPData");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.selectedTranscript) {
          setSelectedTranscript(data.selectedTranscript);
        }
        if (data.manualTranscript) {
          setManualTranscript(data.manualTranscript);
        }
        if (data.selectedPatient) {
          setSelectedPatient(data.selectedPatient);
        }
        if (data.selectedType) {
          setSelectedType(data.selectedType);
        }
        setRestored(true);
      } catch (error) {
        console.error("Failed to parse saved SOAP data:", error);
        localStorage.removeItem("manualSOAPData"); // Clear corrupted data
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const soapData = {
      selectedTranscript,
      manualTranscript,
      selectedPatient,
      selectedType
    };
    localStorage.setItem("manualSOAPData", JSON.stringify(soapData));
  }, [selectedTranscript, manualTranscript, selectedPatient, selectedType]);

  const loadSampleTranscript = (sample: typeof sampleTranscripts[0]) => {
    setSelectedTranscript(sample.transcript);
    setSelectedPatient(sample.patient);
    setSelectedType(sample.type);
    setManualTranscript(''); // Clear manual transcript when loading sample
  };

  const handleTranscriptGenerated = (transcript: string, rawTranscript?: string, patientLang?: string, docLang?: string) => {
    setSelectedTranscript(transcript);
    if (rawTranscript) setSelectedRawTranscript(rawTranscript);
    if (patientLang) setSelectedPatientLang(patientLang);
    if (docLang) setSelectedDocLang(docLang);
    setSelectedPatient('');
    setSelectedType('Live Recording');
    setManualTranscript(''); // Clear manual transcript when recording
  };

  const clearAllData = () => {
    setSelectedTranscript('');
    setSelectedRawTranscript('');
    setSelectedPatientLang('');
    setSelectedDocLang('');
    setManualTranscript('');
    setSelectedPatient('');
    setSelectedType('');
    setRestored(false);
    localStorage.removeItem("manualSOAPData");
  };

  // Use manual transcript if available, otherwise use selected transcript
  const activeTranscript = manualTranscript || selectedTranscript;

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">SOAP Note Generator</h1>
                  <p className="text-white/70 text-sm">Transform transcripts into structured clinical documentation</p>
                </div>
              </div>
              <Button
                onClick={clearAllData}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Clear All
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Restoration Warning */}
        {restored && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-medium">Session restored</span> — Clear before starting a new encounter.
            </span>
          </div>
        )}

        {/* Input Section: Manual + Recording side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Manual Transcript Entry */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 shadow-sm rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-2xl" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-base font-semibold">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Manual Transcript
                </CardTitle>
                <CardDescription className="text-sm">
                  Type or paste your medical transcript
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  placeholder="Type or paste your patient transcript here..."
                  className="min-h-[140px] resize-none border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:border-blue-300 dark:focus:border-blue-600 focus:ring-blue-200 dark:focus:ring-blue-800"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Patient Name</Label>
                    <input
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      placeholder="Enter patient name"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-300 dark:focus:border-blue-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Encounter Type</Label>
                    <input
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      placeholder="e.g., Initial Consultation"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-300 dark:focus:border-blue-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Recording Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 shadow-sm rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-2xl" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-base font-semibold">
                  <Mic className="h-4 w-4 text-emerald-600" />
                  Live Audio Recording
                </CardTitle>
                <CardDescription className="text-sm">
                  Record consultations and get instant transcriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Recorder onTranscriptGenerated={handleTranscriptGenerated} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sample Transcripts — compact collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer px-5 py-3.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sample Transcripts</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">— Try a demo to see how it works</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {sampleTranscripts.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => loadSampleTranscript(sample)}
                  className="text-left p-4 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group/card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{sample.patient}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      {sample.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2.5 leading-relaxed">
                    {sample.transcript.substring(0, 100)}...
                  </p>
                  <span className="text-xs font-medium text-indigo-600 flex items-center gap-1 group-hover/card:gap-2 transition-all">
                    Load Sample
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          </details>
        </motion.div>

        {/* SOAP Generator */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 shadow-sm rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-t-2xl" />
            <CardContent className="p-6">
              <SOAPGenerator
                initialTranscript={activeTranscript}
                initialRawTranscript={selectedRawTranscript}
                patientName={selectedPatient}
                encounterType={selectedType}
                patientLang={selectedPatientLang || undefined}
                docLang={selectedDocLang || undefined}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Clinical Guidelines — compact footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pb-4"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Documentation Guidelines</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">SOAP Format</h4>
                {[
                  { letter: "S", label: "Subjective", desc: "Patient's reported symptoms" },
                  { letter: "O", label: "Objective", desc: "Observable findings" },
                  { letter: "A", label: "Assessment", desc: "Clinical interpretation" },
                  { letter: "P", label: "Plan", desc: "Treatment & follow-up" }
                ].map((item) => (
                  <div key={item.letter} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded flex items-center justify-center text-[10px] font-bold shrink-0">
                      {item.letter}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">{item.label}</span> — {item.desc}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Best Practices</h4>
                {[
                  "Use clear, professional medical terminology",
                  "Include relevant vital signs and measurements",
                  "Document patient's exact words when relevant",
                  "Always review and verify AI-generated content"
                ].map((practice, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{practice}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
