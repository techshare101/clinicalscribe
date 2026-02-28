'use client';

import { useState, useEffect, useRef } from 'react';
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
import { formatDate } from '@/lib/formatDate';

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
  const transcriptRef = useRef(initialTranscript);
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

  // Sync props to internal state unconditionally so parent changes always flow through
  useEffect(() => {
    setTranscript(initialTranscript);
    transcriptRef.current = initialTranscript;
  }, [initialTranscript]);

  useEffect(() => {
    setRawTranscript(initialRawTranscript);
  }, [initialRawTranscript]);

  useEffect(() => {
    setPatientNameInput(patientName);
  }, [patientName]);

  useEffect(() => {
    setEncounterTypeInput(encounterType);
  }, [encounterType]);

  useEffect(() => {
    if (patientLang) setPatientLanguage(patientLang);
  }, [patientLang]);

  useEffect(() => {
    if (docLang) setDocumentationLanguage(docLang);
  }, [docLang]);

  // Keep ref in sync whenever internal state changes
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

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
    // Use ref to guarantee we read the latest transcript (avoids stale closure issues)
    const transcriptToUse = transcriptRef.current || transcript || initialTranscript;
    console.log('[SOAP] generateSOAP called, transcript length:', transcriptToUse.length);
    
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
Date: ${formatDate(soapNote.timestamp)}
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
Date: ${formatDate(soapNote.timestamp)}
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
    localStorage.removeItem("currentTranscript");
  };

  return (
    <div className="space-y-5" data-soap-generator>
      {/* Restoration Warning */}
      <AnimatePresence>
        {restored && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800">
              <span className="font-medium">SOAP note restored</span> — Clear before starting a new session.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Display */}
      {(rawTranscript || transcript) && (
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden relative shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-2xl" />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {showRaw ? 'Raw Transcript' : 'Translated Transcript'}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                  {showRaw ? (patientLanguage === "auto" ? "Auto" : patientLanguage.toUpperCase()) : documentationLanguage.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {rawTranscript && transcript && rawTranscript !== transcript && (
                  <Button variant="outline" size="sm" onClick={() => setShowRaw(!showRaw)} className="text-xs h-7 px-2.5">
                    <FileText className="h-3 w-3 mr-1" />
                    {showRaw ? 'Translated' : 'Raw'}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(showRaw ? rawTranscript : transcript, showRaw ? 'raw' : 'translated')} className="text-xs h-7 px-2.5">
                  {copied === (showRaw ? 'raw' : 'translated') ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            <Textarea
              value={showRaw ? rawTranscript : transcript}
              onChange={(e) => { showRaw ? setRawTranscript(e.target.value) : setTranscript(e.target.value); }}
              className="min-h-[100px] max-h-[200px] bg-gray-50/50 resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200 text-sm"
              placeholder={showRaw ? "Raw transcript..." : "Translated transcript..."}
            />
          </div>
        </div>
      )}

      {/* Patient Info — inline compact row */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-2xl" />
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-900">Patient Information</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Patient Name</Label>
            <Input
              value={patientNameInput}
              onChange={(e) => setPatientNameInput(e.target.value)}
              placeholder="Enter patient name"
              className="h-9 text-sm bg-gray-50/50 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Encounter Type</Label>
            <Input
              value={encounterTypeInput}
              onChange={(e) => setEncounterTypeInput(e.target.value)}
              placeholder="e.g., Initial Consultation"
              className="h-9 text-sm bg-gray-50/50 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
            />
          </div>
        </div>
      </div>

      {/* Generate + Clear buttons */}
      <div className="flex gap-3">
        <Button
          onClick={generateSOAP}
          disabled={isGenerating || (!transcript && !rawTranscript)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-sm"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating ? 'Generating...' : 'Generate SOAP Note'}
        </Button>
        <Button onClick={clearAll} variant="outline" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* SOAP Note Output */}
      <AnimatePresence>
        {soapNote && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {/* Success header bar */}
            <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden relative shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-t-2xl" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">SOAP Note Generated</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        {soapNote.patientName && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" /> {soapNote.patientName}
                          </span>
                        )}
                        {soapNote.encounterType && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {soapNote.encounterType}
                          </span>
                        )}
                        {generationTime && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
                            {(generationTime / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyFullSOAP} className="text-xs h-8">
                      {copied === 'full' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      Copy All
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportSOAP} className="text-xs h-8">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* SOAP Sections — 2x2 grid with colored accent tops */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Subjective */}
              <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-2xl" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">Subjective</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(soapNote.subjective, 'subjective')}>
                      {copied === 'subjective' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{soapNote.subjective}</p>
                </div>
              </div>

              {/* Objective */}
              <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-2xl" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-900">Objective</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(soapNote.objective, 'objective')}>
                      {copied === 'objective' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{soapNote.objective}</p>
                </div>
              </div>

              {/* Assessment */}
              <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-2xl" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-gray-900">Assessment</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(soapNote.assessment, 'assessment')}>
                      {copied === 'assessment' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{soapNote.assessment}</p>
                </div>
              </div>

              {/* Plan */}
              <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-t-2xl" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clipboard className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-900">Plan</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(soapNote.plan, 'plan')}>
                      {copied === 'plan' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{soapNote.plan}</p>
                </div>
              </div>
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