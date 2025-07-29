'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Sparkles
} from 'lucide-react';

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  patientName?: string;
  encounterType?: string;
  timestamp: string;
}

interface SOAPGeneratorProps {
  initialTranscript?: string;
  patientName?: string;
  encounterType?: string;
}

export function SOAPGenerator({ 
  initialTranscript = '', 
  patientName = '',
  encounterType = 'General Consultation'
}: SOAPGeneratorProps) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [patientNameInput, setPatientNameInput] = useState(patientName);
  const [encounterTypeInput, setEncounterTypeInput] = useState(encounterType);
  const [soapNote, setSOAPNote] = useState<SOAPNote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  // Listen for transcript loading events from Recorder
  useEffect(() => {
    const handleLoadTranscript = (event: CustomEvent) => {
      const { transcript: newTranscript } = event.detail;
      setTranscript(newTranscript);
      // Clear previous SOAP note when new transcript is loaded
      setSOAPNote(null);
      setError(null);
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
  }, [initialTranscript]);

  const generateSOAP = async () => {
    if (!transcript.trim()) {
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
          transcript: transcript.trim(),
          patientName: patientNameInput.trim() || undefined,
          encounterType: encounterTypeInput.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate SOAP note');
      }

      const soapData: SOAPNote = await response.json();
      setSOAPNote(soapData);
      setGenerationTime(Date.now() - startTime);
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
    setSOAPNote(null);
    setError(null);
    setPatientNameInput('');
    setEncounterTypeInput('General Consultation');
    setGenerationTime(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" data-soap-generator>
      {/* Input Section */}
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Stethoscope className="h-5 w-5" />
            SOAP Note Generator
          </CardTitle>
          <CardDescription>
            Transform medical transcripts into structured clinical documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient Name
              </Label>
              <Input
                id="patient-name"
                placeholder="Enter patient name (optional)"
                value={patientNameInput}
                onChange={(e) => setPatientNameInput(e.target.value)}
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
                placeholder="e.g., General Consultation, Follow-up"
                value={encounterTypeInput}
                onChange={(e) => setEncounterTypeInput(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          {/* Transcript Input */}
          <div className="space-y-2">
            <Label htmlFor="transcript" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Medical Transcript
            </Label>
            <Textarea
              id="transcript"
              placeholder="Paste or type the medical transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px] bg-white resize-none"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{transcript.length} characters</span>
              {transcript.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateSOAP}
            disabled={isGenerating || !transcript.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating SOAP Note...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate SOAP Note
              </>
            )}
          </Button>

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
        </CardContent>
      </Card>

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
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {soapNote.plan}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signature and PDF Generation */}
      {soapNote && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <SignatureAndPDF
            soapNote={soapNote}
            patientName={patientNameInput}
            encounterType={encounterTypeInput}
          />
        </motion.div>
      )}
    </div>
  );
}