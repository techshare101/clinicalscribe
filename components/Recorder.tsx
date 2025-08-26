'use client';

import { useState, useRef, useEffect } from 'react';
import { transcribeAudio } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { uploadAudioFile } from '@/lib/audioUpload';
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
  AlertCircle,
  Timer
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

interface RecorderProps {
  onTranscriptGenerated?: (transcript: string, rawTranscript: string, patientLang?: string, docLang?: string) => void;
  patientLanguage?: string;
  docLanguage?: string;
  sessionId?: string; // Add session ID for backend storage
}

// Define the recording chunk interface
interface RecordingChunk {
  id: string;
  transcript: string;
  timestamp: Date;
  audioUrl?: string; // Add audio URL for playback
  duration?: number; // Recording duration in seconds
}

export default function Recorder({ 
  onTranscriptGenerated, 
  patientLanguage = "auto", 
  docLanguage = "en",
  sessionId
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recordings, setRecordings] = useState<RecordingChunk[]>([]); // Store multiple recordings
  const [recordingTime, setRecordingTime] = useState(0); // Track recording time
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Waveform visualization refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Function to toggle session active state
  const setSessionActive = async (active: boolean) => {
    if (!sessionId) return;
    
    try {
      const sessionRef = doc(db, 'patientSessions', sessionId);
      await updateDoc(sessionRef, { isActive: active });
    } catch (error) {
      console.error(`Error ${active ? 'activating' : 'deactivating'} session:`, error);
    }
  };

  // Set up waveform visualization
  useEffect(() => {
    if (isRecording && canvasRef.current && streamRef.current) {
      setupVisualizer(streamRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isRecording]);

  // Clean up timer only when recording stops
  useEffect(() => {
    // Clean up timer when component unmounts or recording stops
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Auto-stop recording after 15 minutes (900 seconds)
  useEffect(() => {
    if (isRecording && recordingTime >= 900) { // 15 minutes
      handleStop();
    }
  }, [recordingTime, isRecording]);

  const setupVisualizer = async (stream: MediaStream) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        
        analyserRef.current!.getByteFrequencyData(dataArray);
        
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)'); // indigo-500 with low opacity
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)'); // violet-500
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)'); // pink-500
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw waveform bars with sci-fi glow effect
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          
          // Create gradient for each bar
          const barGradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          barGradient.addColorStop(0, '#6366f1'); // indigo-500
          barGradient.addColorStop(0.5, '#8b5cf6'); // violet-500
          barGradient.addColorStop(1, '#ec4899'); // pink-500
          
          // Draw bar with glow effect
          ctx.fillStyle = barGradient;
          ctx.shadowColor = '#8b5cf6';
          ctx.shadowBlur = 10;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          
          // Reset shadow for next bar
          ctx.shadowBlur = 0;
          
          x += barWidth + 1;
        }
      };
      
      draw();
    } catch (err) {
      console.error('Error setting up visualizer:', err);
    }
  };

  const handleStart = async () => {
    try {
      // Clear any previous errors
      setError(null);
      
      // Reset recording time
      setRecordingTime(0);
      
      // Start recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Use WebM/Opus format for better compression and longer recording support
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // Store stream for visualization
      
      // Force WebM/Opus format for better compression
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4"; // Fallback for iOS Safari
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      recorder.onstop = async () => {
        // Clean up timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // Clean up visualization
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        setLoading(true);
        try {
          const result = await transcribeAudio(audioBlob, patientLanguage, docLanguage);
          setTranscript(result.transcript);
          setRawTranscript(result.rawTranscript);
          
          // Upload audio file to Firebase Storage if we have a session ID
          let audioUrl: string | undefined;
          if (sessionId) {
            try {
              audioUrl = await uploadAudioFile(audioBlob, sessionId);
            } catch (uploadError) {
              console.error('Error uploading audio file:', uploadError);
            }
          }
          
          // Add to recordings array
          const newRecording: RecordingChunk = {
            id: Date.now().toString(),
            transcript: result.transcript,
            timestamp: new Date(),
            audioUrl, // Include the audio URL if available
            duration: recordingTime // Include the recording duration in seconds
          };
          setRecordings(prev => [...prev, newRecording]);
          
          // If we have a session ID, save the recording to the backend
          if (sessionId) {
            try {
              // Save recording to Firestore with isActive flag set to false (recording stopped)
              const response = await fetch('/api/session/recording', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionId,
                  recording: newRecording,
                  isActive: false // Set isActive to false when recording stops
                }),
              });
              
              if (!response.ok) {
                console.error('Failed to save recording to session');
              } else {
                // Check if auto-combine was triggered
                const responseData = await response.json();
                if (responseData.autoCombineTriggered) {
                  console.log('Auto-combine triggered for session due to duration threshold');
                }
              }
            } catch (saveError) {
              console.error('Error saving recording to session:', saveError);
            }
          }
          
          // Notify parent component about new transcript with language information
          onTranscriptGenerated?.(
            result.transcript, 
            result.rawTranscript, 
            result.patientLang || patientLanguage, 
            result.docLang || docLanguage
          );
        } catch (err) {
          console.error('Transcription error:', err);
          const errorMessage = err instanceof Error ? err.message : '⚠️ Failed to transcribe.';
          setError(errorMessage);
          setTranscript('');
          setRawTranscript('');
        } finally {
          setLoading(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      // Set session as active when recording starts
      await setSessionActive(true);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      setError('Please allow microphone access to use this feature.');
    }
  };

  const handleStop = () => {
    mediaRecorderRef.current?.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    
    // Clean up timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Set session as inactive when recording stops
    setSessionActive(false);
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
        detail: { transcript, rawTranscript } 
      });
      window.dispatchEvent(event);
    }
  };

  // Function to combine all recordings into a single transcript
  const combineRecordings = async () => {
    if (!sessionId) {
      // Fallback to client-side combination if no session ID
      const combinedTranscript = recordings.map(r => r.transcript).join('\n\n');
      setTranscript(combinedTranscript);
      setRawTranscript(combinedTranscript);
      
      // Notify parent component about combined transcript
      onTranscriptGenerated?.(combinedTranscript, combinedTranscript, patientLanguage, docLanguage);
      
      // Scroll to SOAP generator
      const soapSection = document.querySelector('[data-soap-generator]');
      if (soapSection) {
        soapSection.scrollIntoView({ behavior: 'smooth' });
        const event = new CustomEvent('loadTranscript', { 
          detail: { transcript: combinedTranscript, rawTranscript: combinedTranscript } 
        });
        window.dispatchEvent(event);
      }
      return;
    }
    
    // Use backend API to combine recordings
    setLoading(true);
    try {
      const response = await fetch('/api/soap/combine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to combine recordings');
      }
      
      // Format the combined SOAP note
      const combinedSoap = `Subjective:\n${data.subjective}\n\nObjective:\n${data.objective}\n\nAssessment:\n${data.assessment}\n\nPlan:\n${data.plan}`;
      setTranscript(combinedSoap);
      setRawTranscript(combinedSoap);
      
      // Notify parent component about combined transcript
      onTranscriptGenerated?.(combinedSoap, combinedSoap, patientLanguage, docLanguage);
      
      // Scroll to SOAP generator
      const soapSection = document.querySelector('[data-soap-generator]');
      if (soapSection) {
        soapSection.scrollIntoView({ behavior: 'smooth' });
        const event = new CustomEvent('loadTranscript', { 
          detail: { transcript: combinedSoap, rawTranscript: combinedSoap } 
        });
        window.dispatchEvent(event);
      }
    } catch (err) {
      console.error('Error combining recordings:', err);
      setError(err instanceof Error ? err.message : 'Failed to combine recordings');
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Waveform Visualization */}
      <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
            Live Audio Visualization
          </h3>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
            Real-time
          </Badge>
        </div>
        <canvas 
          ref={canvasRef} 
          className="w-full h-32 bg-white/50 rounded-xl border border-indigo-200/50"
          width={600}
          height={128}
        />
        <div className="flex justify-center mt-3">
          <Badge variant="outline" className="text-xs text-gray-500">
            Audio waveform visualization during recording
          </Badge>
        </div>
        
        {/* Display language information */}
        <div className="flex gap-2 mt-4 justify-center">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            Patient Language: {
              patientLanguage === "auto" ? "🌐 Auto Detect" : 
              patientLanguage === "so" ? "🇸🇴 Somali" :
              patientLanguage === "hmn" ? "🇱🇦 Hmong" :
              patientLanguage === "sw" ? "🇰🇪 Swahili" :
              patientLanguage === "ar" ? "🇸🇦 Arabic" :
              patientLanguage === "en" ? "🇺🇸 English" :
              patientLanguage.toUpperCase()
            }
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Documentation Language: {
              docLanguage === "en" ? "🇺🇸 English" :
              docLanguage === "so" ? "🇸🇴 Somali" :
              docLanguage === "hmn" ? "🇱🇦 Hmong" :
              docLanguage === "sw" ? "🇰🇪 Swahili" :
              docLanguage === "ar" ? "🇸🇦 Arabic" :
              docLanguage.toUpperCase()
            }
          </Badge>
        </div>
        
        {/* Recording timer */}
        {isRecording && (
          <div className="flex items-center justify-center mt-4 gap-2 text-red-600 font-medium">
            <Timer className="h-5 w-5 animate-pulse" />
            <span>Recording: {formatTime(recordingTime)}</span>
            {recordingTime >= 840 && ( // Warning at 14 minutes
              <span className="text-orange-600">(Approaching 15-min limit)</span>
            )}
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {!isRecording ? (
          <Button
            onClick={handleStart}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Mic className="h-5 w-5" />
            {loading ? 'Transcribing...' : 'Start Recording'}
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Square className="h-5 w-5" />
            Stop Recording ({formatTime(recordingTime)})
          </Button>
        )}
        
        {transcript && (
          <Button
            onClick={generateSOAP}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Stethoscope className="h-5 w-5" />
            Generate SOAP Note
          </Button>
        )}
        
        {/* Show Combine button when we have multiple recordings */}
        {recordings.length > 1 && (
          <Button
            onClick={combineRecordings}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Combining...
              </>
            ) : (
              <>
                <Stethoscope className="h-5 w-5" />
                Combine into Final SOAP
              </>
            )}
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-800">Recording Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Transcribed Text
              </h3>
              <Button
                onClick={copyTranscript}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
          </div>
        </div>
      )}
      
      {/* Show recordings list when we have multiple recordings */}
      {recordings.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Recordings ({recordings.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recordings.map((recording, index) => (
              <div key={recording.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Recording {index + 1}</span>
                <span className="text-xs text-gray-500">
                  {recording.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Combine all recordings into a single SOAP note using the "Combine into Final SOAP" button above.
          </div>
        </div>
      )}
    </div>
  );
}