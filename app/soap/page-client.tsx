'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Brain,
  Clipboard,
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

  const handleTranscriptGenerated = (transcript: string) => {
    setSelectedTranscript(transcript);
    setSelectedPatient('');
    setSelectedType('Live Recording');
    setManualTranscript(''); // Clear manual transcript when recording
  };

  const clearAllData = () => {
    setSelectedTranscript('');
    setManualTranscript('');
    setSelectedPatient('');
    setSelectedType('');
    setRestored(false);
    localStorage.removeItem("manualSOAPData");
  };

  // Use manual transcript if available, otherwise use selected transcript
  const activeTranscript = manualTranscript || selectedTranscript;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100">
              AI SOAP Note Generator
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform medical transcripts into structured clinical documentation using advanced AI
          </p>
        </motion.div>

        {/* Restoration Warning */}
        {restored && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <span className="font-medium">Restored saved SOAP data</span> - Data was automatically restored from your previous session. 
              Clear manually before starting a new session.
            </div>
          </motion.div>
        )}

        {/* Manual Transcript Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <FileText className="h-5 w-5" />
                    Manual Transcript Entry
                  </CardTitle>
                  <CardDescription>
                    Type or paste your medical transcript directly
                  </CardDescription>
                </div>
                <Button
                  onClick={clearAllData}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-transcript">Patient Transcript</Label>
                  <Textarea
                    id="manual-transcript"
                    value={manualTranscript}
                    onChange={(e) => setManualTranscript(e.target.value)}
                    placeholder="Type or paste your patient transcript here..."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-patient">Patient Name</Label>
                    <input
                      id="manual-patient"
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      placeholder="Enter patient name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-type">Encounter Type</Label>
                    <input
                      id="manual-type"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      placeholder="e.g., Initial Consultation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Recording Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Mic className="h-5 w-5" />
                Live Audio Recording
              </CardTitle>
              <CardDescription>
                Record medical consultations in real-time and get instant transcriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Recorder onTranscriptGenerated={handleTranscriptGenerated} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Sample Transcripts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sample Medical Transcripts
              </CardTitle>
              <CardDescription>
                Try these sample transcripts to see how the SOAP generator works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sampleTranscripts.map((sample) => (
                  <Card key={sample.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{sample.patient}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {sample.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                        {sample.transcript.substring(0, 120)}...
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSampleTranscript(sample)}
                        className="w-full flex items-center gap-2"
                      >
                        Load Sample
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SOAP Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mb-12"
        >
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">AI SOAP Generator</h3>
                  <p className="text-gray-300">Transform transcripts into clinical documentation</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <SOAPGenerator
                initialTranscript={activeTranscript}
                patientName={selectedPatient}
                encounterType={selectedType}
              />
            </div>
          </div>
        </motion.div>

        {/* Clinical Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-amber-200/50 overflow-hidden">
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-900">Clinical Documentation Guidelines</h3>
                  <p className="text-amber-700">Best practices for professional medical documentation</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/30">
                  <h4 className="font-black text-amber-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    SOAP Format
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: "Subjective", desc: "Patient's reported symptoms and concerns" },
                      { label: "Objective", desc: "Observable findings and measurements" },
                      { label: "Assessment", desc: "Clinical interpretation and diagnosis" },
                      { label: "Plan", desc: "Treatment plan and follow-up instructions" }
                    ].map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {item.label[0]}
                        </div>
                        <div>
                          <span className="font-bold text-amber-900">{item.label}:</span>
                          <span className="text-amber-800 ml-2">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/30">
                  <h4 className="font-black text-amber-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    Best Practices
                  </h4>
                  <div className="space-y-2">
                    {[
                      "Use clear, professional medical terminology",
                      "Include relevant vital signs and measurements",
                      "Document patient's exact words when relevant",
                      "Always review and verify AI-generated content"
                    ].map((practice, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-amber-800 text-sm font-medium">{practice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
