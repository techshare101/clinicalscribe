'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SignatureAndPDF from '@/components/SignatureAndPDF';
import {
  FileText,
  Loader2,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Stethoscope,
  Eye,
  Brain,
  Clipboard,
  RefreshCw,
  Sparkles,
  Languages,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  patientName?: string;
  encounterType?: string;
  timestamp: string;
  patientLang?: string;
  docLang?: string;
}

interface SOAPGeneratorProps {
  initialTranscript?: string;
  initialRawTranscript?: string;
  patientName?: string;
  encounterType?: string;
  patientLang?: string;
  docLang?: string;
}

export function SOAPGenerator({ 
  initialTranscript = '', 
  initialRawTranscript = '',
  patientName = '',
  encounterType = 'General Consultation',
  patientLang = 'en',
  docLang = 'en'
}: SOAPGeneratorProps) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [rawTranscript, setRawTranscript] = useState(initialRawTranscript);
  const [patientNameInput, setPatientNameInput] = useState(patientName);
  const [encounterTypeInput, setEncounterTypeInput] = useState(encounterType);
  const [soapNote, setSOAPNote] = useState<SOAPNote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [patientLanguage, setPatientLanguage] = useState(patientLang);
  const [documentationLanguage, setDocumentationLanguage] = useState(docLang);
  const [restored, setRestored] = useState(false); // Track if SOAP note was restored

  // Listen for transcript loading events from Recorder
  useEffect(() => {
    const handleLoadTranscript = (event: CustomEvent) => {
      const { transcript: newTranscript, rawTranscript: newRawTranscript, patientLang, docLang } = event.detail;
      setTranscript(newTranscript);
      setRawTranscript(newRawTranscript);
      if (patientLang) setPatientLanguage(patientLang);
      if (docLang) setDocumentationLanguage(docLang);
      // Clear previous SOAP note when new transcript is loaded
      setSOAPNote(null);
      setError(null);
      setRestored(false); // New transcript, not restored
      // Auto-scroll to this component
      setTimeout(() => {
        const element = document.querySelector('[data-soap-generator]');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };

    window.addEventListener('loadTranscript', handleLoadTranscript as EventListener);
    return () => {
      window.removeEventListener('loadTranscript', handleLoadTranscript as EventListener);
    };
  }, []);

  // Update transcript when initialTranscript prop changes
  useEffect(() => {
    if (initialTranscript) {
      setTranscript(initialTranscript);
    }
    if (initialRawTranscript) {
      setRawTranscript(initialRawTranscript);
    }
    if (patientLang) {
      setPatientLanguage(patientLang);
    }
    if (docLang) {
      setDocumentationLanguage(docLang);
    }
  }, [initialTranscript, initialRawTranscript, patientLang, docLang]);

  // Load SOAP note from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("currentSOAPNote");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSOAPNote(data.soapNote);
        setPatientNameInput(data.patientName || "");
        setEncounterTypeInput(data.encounterType || "General Consultation");
        setRestored(true);
      } catch (error) {
        console.error("Failed to parse saved SOAP note data:", error);
        localStorage.removeItem("currentSOAPNote"); // Clear corrupted data
      }
    }
  }, []);

  // Save SOAP note to localStorage whenever it changes
  useEffect(() => {
    if (soapNote) {
      const soapData = {
        soapNote: soapNote,
        patientName: patientNameInput,
        encounterType: encounterTypeInput,
      };
      localStorage.setItem("currentSOAPNote", JSON.stringify(soapData));
    }
  }, [soapNote, patientNameInput, encounterTypeInput]);

  const generateSOAP = async () => {
    // Always use the translated transcript for SOAP generation
    const transcriptToUse = transcript;
    
    if (!transcriptToUse.trim()) {
      setError('Please enter a transcript to generate SOAP note');
      return;
    }

    const startTime = Date.now();
    setIsGenerating(true);
    setError(null);
    setSOAPNote(null);

    try {
      const response = await fetch('/api/soap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptToUse.trim(),
          patientName: patientNameInput.trim() || undefined,
          encounterType: encounterTypeInput.trim() || undefined,
          patientLang: patientLanguage,
          docLang: documentationLanguage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate SOAP note');
      }

      const soapData: SOAPNote = await response.json();
      // Ensure language info is included
      soapData.patientLang = patientLanguage;
      soapData.docLang = documentationLanguage;
      setSOAPNote(soapData);
      setGenerationTime(Date.now() - startTime);
      setRestored(false); // New SOAP note, not restored
    } catch (err) {
      console.error('SOAP generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate SOAP note');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(section);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyFullSOAP = async () => {
    if (!soapNote) return;
    
    const fullSOAP = `SOAP NOTE
${soapNote.patientName ? `Patient: ${soapNote.patientName}` : ''}
${soapNote.encounterType ? `Encounter: ${soapNote.encounterType}` : ''}
Date: ${new Date(soapNote.timestamp).toLocaleDateString()}
Patient Language: ${soapNote.patientLang || patientLanguage}
Documentation Language: ${soapNote.docLang || documentationLanguage}

SUBJECTIVE:
${soapNote.subjective}

OBJECTIVE:
${soapNote.objective}

ASSESSMENT:
${soapNote.assessment}

PLAN:
${soapNote.plan}`;

    await copyToClipboard(fullSOAP, 'full');
  };

  const exportSOAP = () => {
    if (!soapNote) return;
    
    const fullSOAP = `SOAP NOTE
${soapNote.patientName ? `Patient: ${soapNote.patientName}` : ''}
${soapNote.encounterType ? `Encounter: ${soapNote.encounterType}` : ''}
Date: ${new Date(soapNote.timestamp).toLocaleDateString()}
Patient Language: ${soapNote.patientLang || patientLanguage}
Documentation Language: ${soapNote.docLang || documentationLanguage}

SUBJECTIVE:
${soapNote.subjective}

OBJECTIVE:
${soapNote.objective}

ASSESSMENT:
${soapNote.assessment}

PLAN:
${soapNote.plan}`;

    const blob = new Blob([fullSOAP], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOAP_${soapNote.patientName || 'Patient'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setTranscript('');
    setRawTranscript('');
    setPatientNameInput('');
    setEncounterTypeInput('General Consultation');
    setSOAPNote(null);
    setError(null);
    setRestored(false);
    localStorage.removeItem("currentSOAPNote");
    // Also clear the transcript data from localStorage
    localStorage.removeItem("currentTranscript");
  };

  return (
    <div className="space-y-6" data-soap-generator>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            SOAP Note Generator
          </h2>
          <p className="text-gray-600">Transform your transcription into structured clinical documentation</p>
        </div>
      </motion.div>

      {/* Restoration Warning */}
      <AnimatePresence>
        {restored && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <span className="font-medium">Restored saved SOAP note</span> - Data was automatically restored from your previous session. 
              Clear manually before starting a new session.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Display - Always show translated transcript */}
      {(rawTranscript || transcript) && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Languages className="h-5 w-5" />
                Translated Transcript (Documentation Language)
              </CardTitle>
              
              {rawTranscript && transcript && rawTranscript !== transcript && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRaw(!showRaw)}
                  className="flex items-center gap-2"
                >
                  {showRaw ? (
                    <>
                      <FileText className="h-4 w-4" />
                      Show Translated Text
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Show Raw Transcript
                    </>
                  )}
                </Button>
              )}
            </div>
            <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              {showRaw ? 
                `Patient Language: ${
                  patientLanguage === "auto" ? "🌐 Auto Detected" :
                  patientLanguage === "so" ? "🇸🇴 Somali" :
                  patientLanguage === "hmn" ? "🇱🇦 Hmong" :
                  patientLanguage === "sw" ? "🇰🇪 Swahili" :
                  patientLanguage === "ar" ? "🇸🇦 Arabic" :
                  patientLanguage === "en" ? "🇺🇸 English" :
                  patientLanguage.toUpperCase()
                }` : 
                `Documentation Language: ${
                  documentationLanguage === "en" ? "🇺🇸 English" :
                  documentationLanguage === "so" ? "🇸🇴 Somali" :
                  documentationLanguage === "hmn" ? "🇱🇦 Hmong" :
                  documentationLanguage === "sw" ? "🇰🇪 Swahili" :
                  documentationLanguage === "ar" ? "🇸🇦 Arabic" :
                  documentationLanguage.toUpperCase()
                }`
              }
            </Badge>
          </CardHeader>
          <CardContent>
            <Textarea
              value={showRaw ? rawTranscript : transcript}
              onChange={(e) => {
                if (showRaw) {
                  setRawTranscript(e.target.value);
                } else {
                  setTranscript(e.target.value);
                }
              }}
              className="min-h-[120px] bg-white resize-none"
              placeholder={showRaw ? "Raw transcript will appear here..." : "Translated transcript will appear here..."}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {showRaw ? (
                  <>Original Patient Language: {
                    patientLanguage === "auto" ? "🌐 Auto Detected" :
                    patientLanguage === "so" ? "🇸🇴 Somali" :
                    patientLanguage === "hmn" ? "🇱🇦 Hmong" :
                    patientLanguage === "sw" ? "🇰🇪 Swahili" :
                    patientLanguage === "ar" ? "🇸🇦 Arabic" :
                    patientLanguage === "en" ? "🇺🇸 English" :
                    patientLanguage.toUpperCase()
                  }</>
                ) : (
                  <>Translated to Documentation Language: {
                    documentationLanguage === "en" ? "🇺🇸 English" :
                    documentationLanguage === "so" ? "🇸🇴 Somali" :
                    documentationLanguage === "hmn" ? "🇱🇦 Hmong" :
                    documentationLanguage === "sw" ? "🇰🇪 Swahili" :
                    documentationLanguage === "ar" ? "🇸🇦 Arabic" :
                    documentationLanguage.toUpperCase()
                  }</>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(showRaw ? rawTranscript : transcript, showRaw ? 'raw' : 'translated')}
              >
                {copied === (showRaw ? 'raw' : 'translated') ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === (showRaw ? 'raw' : 'translated') ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient and Encounter Information */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient Name
              </Label>
              <Input
                id="patient-name"
                value={patientNameInput}
                onChange={(e) => setPatientNameInput(e.target.value)}
                placeholder="Enter patient name"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="encounter-type" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Encounter Type
              </Label>
              <Input
                id="encounter-type"
                value={encounterTypeInput}
                onChange={(e) => setEncounterTypeInput(e.target.value)}
                placeholder="e.g., Initial Consultation, Follow-up"
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={generateSOAP}
          disabled={isGenerating || (!transcript && !rawTranscript)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? 'Generating SOAP Note...' : 'Generate SOAP Note'}
        </Button>
        <Button
          onClick={clearAll}
          variant="outline"
          className="flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* SOAP Note Display */}
      <AnimatePresence>
        {soapNote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Header with Actions */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-green-900">
                      <CheckCircle className="h-5 w-5" />
                      SOAP Note Generated
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      {soapNote.patientName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {soapNote.patientName}
                        </span>
                      )}
                      {soapNote.encounterType && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {soapNote.encounterType}
                        </span>
                      )}
                      {generationTime && (
                        <Badge variant="secondary" className="text-xs">
                          Generated in {(generationTime / 1000).toFixed(1)}s
                        </Badge>
                      )}
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        Patient Language: {(soapNote.patientLang || patientLanguage).toUpperCase()}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Documentation Language: {(soapNote.docLang || documentationLanguage).toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyFullSOAP}
                      className="flex items-center gap-2"
                    >
                      {copied === 'full' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copy All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportSOAP}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* SOAP Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Subjective */}
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
                      onClick={() => copyToClipboard(soapNote.subjective, 'subjective')}
                    >
                      {copied === 'subjective' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {soapNote.subjective}
                  </p>
                </CardContent>
              </Card>

              {/* Objective */}
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
                      onClick={() => copyToClipboard(soapNote.objective, 'objective')}
                    >
                      {copied === 'objective' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {soapNote.objective}
                  </p>
                </CardContent>
              </Card>

              {/* Assessment */}
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
                      onClick={() => copyToClipboard(soapNote.assessment, 'assessment')}
                    >
                      {copied === 'assessment' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {soapNote.assessment}
                  </p>
                </CardContent>
              </Card>

              {/* Plan */}
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
                      onClick={() => copyToClipboard(soapNote.plan, 'plan')}
                    >
                      {copied === 'plan' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {soapNote.plan}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Signature and PDF Section */}
            <SignatureAndPDF 
              soapNote={soapNote} 
              patientName={patientNameInput}
              encounterType={encounterTypeInput}
              rawTranscript={rawTranscript}
              translatedTranscript={transcript}
              patientLang={patientLanguage}
              docLang={documentationLanguage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}