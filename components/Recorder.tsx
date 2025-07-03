'use client';

import { useState, useRef } from 'react';
import { transcribeAudio } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  Square, 
  Loader2, 
  Copy, 
  Stethoscope,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface RecorderProps {
  onTranscriptGenerated?: (transcript: string) => void;
}

export default function Recorder({ onTranscriptGenerated }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setLoading(true);
        try {
          const text = await transcribeAudio(audioBlob);
          setTranscript(text);
          // Notify parent component about new transcript
          onTranscriptGenerated?.(text);
        } catch (err) {
          console.error('Transcription error:', err);
          setTranscript('⚠️ Failed to transcribe.');
        } finally {
          setLoading(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Please allow microphone access to use this feature.');
    }
  };

  const handleStop = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateSOAP = () => {
    // Scroll to SOAP generator section
    const soapSection = document.querySelector('[data-soap-generator]');
    if (soapSection) {
      soapSection.scrollIntoView({ behavior: 'smooth' });
      // Trigger SOAP generation with current transcript
      const event = new CustomEvent('loadTranscript', { 
        detail: { transcript } 
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          🎙️ ClinicalScribe Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center">
          <Button
            onClick={isRecording ? handleStop : handleStart}
            disabled={loading}
            size="lg"
            className={`px-8 py-4 text-lg font-semibold transition-all ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="h-5 w-5 mr-2" />
                🛑 Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                🎤 Start Recording
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-blue-700 font-medium">Transcribing audio...</span>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="space-y-3">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-gray-800">Transcript Ready</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✅ Completed
              </Badge>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {transcript}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyTranscript}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                onClick={generateSOAP}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Stethoscope className="h-4 w-4" />
                🧼 Generate SOAP Note
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!transcript && !loading && !isRecording && (
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Click the microphone button to start recording patient conversations. 
              The audio will be transcribed using OpenAI's Whisper API.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}