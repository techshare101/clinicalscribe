'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Download
} from 'lucide-react';

// Define the SOAP Note interface
interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  patientName?: string;
  encounterType?: string;
  timestamp: string;
}

export default function TestSOAPPage() {
  const [transcript, setTranscript] = useState('');
  const [patientName, setPatientName] = useState('');
  const [encounterType, setEncounterType] = useState('');
  const [soapNote, setSOAPNote] = useState<SOAPNote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Sample transcript for testing
  const sampleTranscript = `Patient is a 45-year-old male presenting with chief complaint of lower back pain for the past 3 days. Pain started after lifting heavy boxes at work. Describes pain as sharp, 7/10 intensity, worse with movement, better with rest. No radiation to legs, no numbness or tingling. No bowel or bladder dysfunction. Has tried over-the-counter ibuprofen with minimal relief.

Physical examination reveals mild tenderness over L4-L5 region, normal range of motion, negative straight leg raise test bilaterally. Vital signs stable: BP 130/80, HR 72, temp 98.6F. Patient appears comfortable at rest.

Assessment: Likely mechanical low back pain secondary to muscle strain from lifting. No signs of nerve root compression or serious pathology.

Plan: Continue NSAIDs, add muscle relaxant, physical therapy referral, work restrictions for 1 week, follow up in 2 weeks if not improved.`;

  const handleGenerateSOAP = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript to generate SOAP note');
      return;
    }

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
          patientName: patientName.trim() || undefined,
          encounterType: encounterType.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate SOAP note');
      }

      const soapData = await response.json();
      setSOAPNote(soapData);
    } catch (err) {
      console.error('SOAP generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate SOAP note');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text.substring(0, 20));
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const loadSampleTranscript = () => {
    setTranscript(sampleTranscript);
    setPatientName('John Smith');
    setEncounterType('Urgent Care Visit');
  };

  const exportSOAP = () => {
    if (!soapNote) return;
    
    const content = `SOAP NOTE
Generated: ${soapNote.timestamp}
${soapNote.patientName ? `Patient: ${soapNote.patientName}` : ''}
${soapNote.encounterType ? `Encounter: ${soapNote.encounterType}` : ''}

SUBJECTIVE:
${soapNote.subjective}

OBJECTIVE:
${soapNote.objective}

ASSESSMENT:
${soapNote.assessment}

PLAN:
${soapNote.plan}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soap-note-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">SOAP Generator Test</h1>
          <p className="text-lg text-gray-600">Test the AI-powered SOAP note generation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Transcript Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={loadSampleTranscript}
                  variant="outline"
                  className="w-full"
                >
                  Load Sample Transcript
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient Name (Optional)</label>
                  <Input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Encounter Type (Optional)</label>
                  <Input
                    value={encounterType}
                    onChange={(e) => setEncounterType(e.target.value)}
                    placeholder="e.g., Office Visit, Consultation"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Medical Transcript</label>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Enter or paste the medical transcript here..."
                  className="min-h-[300px] resize-none"
                />
              </div>

              <Button 
                onClick={handleGenerateSOAP}
                disabled={isGenerating || !transcript.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating SOAP Note...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate SOAP Note
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Generated SOAP Note
                </span>
                {soapNote && (
                  <Button onClick={exportSOAP} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!soapNote && !isGenerating && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a transcript and click "Generate SOAP Note" to see results</p>
                </div>
              )}

              {isGenerating && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="text-gray-600">Generating SOAP note...</p>
                </div>
              )}

              {soapNote && (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        Generated: {new Date(soapNote.timestamp).toLocaleString()}
                      </Badge>
                    </div>
                    {soapNote.patientName && (
                      <p><strong>Patient:</strong> {soapNote.patientName}</p>
                    )}
                    {soapNote.encounterType && (
                      <p><strong>Encounter:</strong> {soapNote.encounterType}</p>
                    )}
                  </div>

                  {/* SOAP Sections */}
                  <div className="space-y-4">
                    {/* Subjective */}
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-blue-800">SUBJECTIVE</h3>
                        <Button
                          onClick={() => copyToClipboard(soapNote.subjective)}
                          variant="ghost"
                          size="sm"
                        >
                          {copied === soapNote.subjective.substring(0, 20) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{soapNote.subjective}</p>
                    </div>

                    {/* Objective */}
                    <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-green-800">OBJECTIVE</h3>
                        <Button
                          onClick={() => copyToClipboard(soapNote.objective)}
                          variant="ghost"
                          size="sm"
                        >
                          {copied === soapNote.objective.substring(0, 20) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{soapNote.objective}</p>
                    </div>

                    {/* Assessment */}
                    <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-yellow-800">ASSESSMENT</h3>
                        <Button
                          onClick={() => copyToClipboard(soapNote.assessment)}
                          variant="ghost"
                          size="sm"
                        >
                          {copied === soapNote.assessment.substring(0, 20) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{soapNote.assessment}</p>
                    </div>

                    {/* Plan */}
                    <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-purple-800">PLAN</h3>
                        <Button
                          onClick={() => copyToClipboard(soapNote.plan)}
                          variant="ghost"
                          size="sm"
                        >
                          {copied === soapNote.plan.substring(0, 20) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{soapNote.plan}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Full Copy Button */}
                  <Button
                    onClick={() => copyToClipboard(`SUBJECTIVE:\n${soapNote.subjective}\n\nOBJECTIVE:\n${soapNote.objective}\n\nASSESSMENT:\n${soapNote.assessment}\n\nPLAN:\n${soapNote.plan}`)}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Full SOAP Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}