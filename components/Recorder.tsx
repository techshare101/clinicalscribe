'use client';

import { useState, useRef, useEffect } from 'react';
import { transcribeAudio } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { uploadAudioFile } from '@/lib/audioUpload';
import { languageNames } from '@/lib/languageUtils';
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
  Timer,
  Play,
  Pause
} from 'lucide-react';
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';

interface RecorderProps {
  onTranscriptGenerated?: (transcript: string, rawTranscript: string, patientLang?: string, docLang?: string) => void;
  patientLanguage?: string;
  docLanguage?: string;
  sessionId?: string; // Add session ID for backend storage
  resetSignal?: number; // Increment to trigger full reset from parent
}

// Define the recording chunk interface
interface RecordingChunk {
  id: string;
  transcript: string;
  timestamp: Date;
  audioUrl?: string; // Add audio URL for playback
  duration?: number; // Recording duration in seconds
}

// Define transcript chunk interface for ordered stitching
interface TranscriptChunk {
  index: number;
  transcript: string;
  rawTranscript: string;
  patientLang?: string;
  docLang?: string;
  success: boolean;
  error?: string;
}

export default function Recorder({ 
  onTranscriptGenerated, 
  patientLanguage = "auto", 
  docLanguage = "en",
  sessionId,
  resetSignal = 0,
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
  
  // Streaming transcription state — transcribe each 30s segment as it arrives
  const segmentIndexRef = useRef(0);
  const segmentTranscripts = useRef<{ index: number; transcript: string; rawTranscript: string }[]>([]);
  const pendingTranscriptions = useRef(0);
  const mimeTypeRef = useRef("audio/webm;codecs=opus");
  const [recordingTime, setRecordingTime] = useState(0); // Track recording time
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Chunk recording state
  const [currentChunk, setCurrentChunk] = useState(1); // Current chunk number (1-4)
  const [totalChunks, setTotalChunks] = useState(0); // Total chunks recorded
  const [isChunkCompleted, setIsChunkCompleted] = useState(false); // Whether current chunk is completed
  const [showNextChunkPrompt, setShowNextChunkPrompt] = useState(false); // Show prompt for next chunk
  
  // Ordered stitching state
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([]); // Store chunks with index for ordered stitching
  const transcriptChunksRef = useRef<TranscriptChunk[]>([]); // Ref mirror to avoid stale reads
  const [progressMessage, setProgressMessage] = useState<string>(""); // Progress feedback message
  
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

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Reset all state when parent triggers a clear
  useEffect(() => {
    if (resetSignal > 0) {
      setTranscript('');
      setRawTranscript('');
      setRecordings([]);
      setTranscriptChunks([]);
      transcriptChunksRef.current = [];
      setCurrentChunk(1);
      setTotalChunks(0);
      setIsChunkCompleted(false);
      setShowNextChunkPrompt(false);
      setProgressMessage('');
      setError(null);
      setRecordingTime(0);
    }
  }, [resetSignal]);

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
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          
          const barGradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          barGradient.addColorStop(0, '#6366f1');
          barGradient.addColorStop(0.5, '#8b5cf6');
          barGradient.addColorStop(1, '#ec4899');
          
          ctx.fillStyle = barGradient;
          ctx.shadowColor = '#8b5cf6';
          ctx.shadowBlur = 10;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          
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
      setError(null);
      setRecordingTime(0);
      setIsChunkCompleted(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
        }
      });
      streamRef.current = stream;
      
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4";
      }
      
      const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
      const bitsPerSecond = isProduction ? 64000 : 128000;
      
      console.log(`🎙️ Recording at ${bitsPerSecond / 1000}kbps (${isProduction ? 'production' : 'development'} mode)`);
      
      const recorder = new MediaRecorder(stream, { mimeType, bitsPerSecond });
      audioChunks.current = [];
      mimeTypeRef.current = mimeType;
      segmentIndexRef.current = 0;
      segmentTranscripts.current = [];
      pendingTranscriptions.current = 0;

      // ── SEQUENTIAL TRANSCRIPTION QUEUE ──
      // Segments are queued as they arrive and processed ONE AT A TIME
      // to avoid overwhelming Vercel serverless functions with parallel requests.
      // Each segment retries once on failure. Live UI updates as text completes.
      const segmentQueue: { idx: number; blob: Blob }[] = [];
      let queueProcessing = false;

      const processQueue = async () => {
        if (queueProcessing) return; // already running
        queueProcessing = true;

        while (segmentQueue.length > 0) {
          const { idx: segIdx, blob: segmentBlob } = segmentQueue.shift()!;
          const sizeMB = (segmentBlob.size / (1024 * 1024)).toFixed(2);
          console.log(`🎤 Processing segment ${segIdx} (${sizeMB} MB)`);
          setProgressMessage(`🎤 Transcribing segment ${segIdx + 1}...`);

          // Transcribe with 1 retry on failure
          let result: { transcript: string; rawTranscript: string } | null = null;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const res = await transcribeAudio(segmentBlob, patientLanguage, docLanguage, segIdx);
              result = { transcript: res.transcript, rawTranscript: res.rawTranscript };
              break;
            } catch (segErr) {
              if (attempt === 0) {
                console.warn(`⚠️ Segment ${segIdx} attempt 1 failed, retrying...`, segErr);
                await new Promise(r => setTimeout(r, 1500));
              } else {
                console.error(`❌ Segment ${segIdx} failed after retry:`, segErr);
              }
            }
          }

          if (result && result.transcript) {
            segmentTranscripts.current.push({
              index: segIdx,
              transcript: result.transcript,
              rawTranscript: result.rawTranscript,
            });
            console.log(`✅ Segment ${segIdx} transcribed (${result.transcript.length} chars)`);
          } else {
            segmentTranscripts.current.push({ index: segIdx, transcript: '', rawTranscript: '' });
            console.warn(`⚠️ Segment ${segIdx} produced no text`);
          }

          // Stitch all completed segments in order and update UI
          const ordered = [...segmentTranscripts.current].sort((a, b) => a.index - b.index);
          const liveText = ordered.map(s => s.transcript).filter(Boolean).join(' ');
          const liveRaw = ordered.map(s => s.rawTranscript).filter(Boolean).join(' ');

          // Use functional updates to avoid stale closures
          setTranscript(() => liveText);
          setRawTranscript(() => liveRaw);

          const completed = segmentTranscripts.current.filter(s => s.transcript).length;
          const total = segmentIndexRef.current;
          setProgressMessage(`✅ ${completed}/${total} segments transcribed`);
          pendingTranscriptions.current--;

          // Upload audio to Firebase Storage in background
          if (sessionId) {
            uploadAudioFile(segmentBlob, sessionId).catch(err =>
              console.error('Audio upload failed:', err)
            );
          }

          // Yield to React so state updates flush to the DOM between segments
          await new Promise(r => setTimeout(r, 50));
        }

        queueProcessing = false;
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          const segIdx = segmentIndexRef.current++;
          const segmentBlob = new Blob([event.data], { type: mimeType });
          pendingTranscriptions.current++;

          // Queue the segment for sequential processing
          segmentQueue.push({ idx: segIdx, blob: segmentBlob });
          processQueue(); // start processing if not already running
        }
      };

      // ── ON STOP: stitch segment transcripts together ──
      // No giant blob is ever sent to the API — only small 30s segments.
      recorder.onstop = async () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }

        setLoading(true);
        setProgressMessage('Finalizing transcription...');

        // Wait for the sequential queue to drain (max 120s for long recordings)
        const waitStart = Date.now();
        while (pendingTranscriptions.current > 0 && Date.now() - waitStart < 120000) {
          await new Promise(r => setTimeout(r, 500));
          const completed = segmentTranscripts.current.filter(s => s.transcript).length;
          const total = segmentIndexRef.current;
          setProgressMessage(`⏳ Finishing transcription... ${completed}/${total} segments done`);
        }

        // Stitch all segment transcripts in order
        const ordered = [...segmentTranscripts.current].sort((a, b) => a.index - b.index);
        const stitchedTranscript = ordered.map(s => s.transcript).filter(Boolean).join(' ');
        const stitchedRaw = ordered.map(s => s.rawTranscript).filter(Boolean).join(' ');

        console.log(`📋 Stitched ${ordered.length} segments → ${stitchedTranscript.length} chars`);

        // Force final transcript into UI state (processQueue live updates may have missed segments)
        setTranscript(() => stitchedTranscript);
        setRawTranscript(() => stitchedRaw);

        if (!stitchedTranscript.trim()) {
          setError('No speech detected in this recording. Please try again.');
          setLoading(false);
          return;
        }

        try {
          setProgressMessage(`✅ Chunk ${currentChunk}/4 complete`);

          const newChunk: TranscriptChunk = {
            index: currentChunk,
            transcript: stitchedTranscript,
            rawTranscript: stitchedRaw,
            patientLang: patientLanguage,
            docLang: docLanguage,
            success: true
          };

          setTranscriptChunks(prev => {
            const updated = [...prev, newChunk].sort((a, b) => a.index - b.index);
            transcriptChunksRef.current = updated;
            return updated;
          });

          // Save to Firestore
          if (sessionId && auth.currentUser) {
            try {
              const chunkRef = doc(collection(db, 'transcriptions', auth.currentUser.uid, sessionId));
              await setDoc(chunkRef, {
                index: currentChunk,
                transcript: stitchedTranscript,
                rawTranscript: stitchedRaw,
                patientLang: patientLanguage,
                docLang: docLanguage,
                createdAt: new Date(),
                status: 'completed'
              });
            } catch (saveError) {
              console.error('Error saving chunk to Firestore:', saveError);
            }
          }

          const newRecording: RecordingChunk = {
            id: Date.now().toString(),
            transcript: stitchedTranscript,
            timestamp: new Date(),
            duration: recordingTime
          };
          setRecordings(prev => [...prev, newRecording]);

          // Save recording to session backend
          if (sessionId) {
            try {
              const response = await fetch('/api/session/recording', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, recording: newRecording, isActive: false }),
              });
              if (response.ok) {
                const responseData = await response.json();
                if (responseData.autoCombineTriggered) {
                  console.log('Auto-combine triggered for session');
                }
              }
            } catch (saveError) {
              console.error('Error saving recording to session:', saveError);
            }
          }

          // Notify parent component
          const detectedLang = patientLanguage !== "auto" ? patientLanguage : undefined;
          onTranscriptGenerated?.(stitchedTranscript, stitchedRaw, detectedLang);

          setIsChunkCompleted(true);
          setTotalChunks(prev => prev + 1);

          if (currentChunk < 4) {
            setShowNextChunkPrompt(true);
          } else {
            setProgressMessage("🎉 All chunks processed! Generating final transcript...");
            setTimeout(() => { combineRecordings(); }, 1500);
          }
        } catch (err) {
          console.error('Transcription stitching error:', err);
          setError(err instanceof Error ? err.message : 'Transcription failed');
          setProgressMessage(`⚠️ Chunk ${currentChunk} failed`);

          const failedChunk: TranscriptChunk = {
            index: currentChunk, transcript: '', rawTranscript: '',
            success: false, error: err instanceof Error ? err.message : 'Unknown error'
          };
          setTranscriptChunks(prev => {
            const updated = [...prev, failedChunk].sort((a, b) => a.index - b.index);
            transcriptChunksRef.current = updated;
            return updated;
          });
          setIsChunkCompleted(true);
          setTotalChunks(prev => prev + 1);

          if (currentChunk < 4) {
            setShowNextChunkPrompt(true);
          } else {
            setProgressMessage("⚠️ Some chunks failed, generating partial transcript...");
            setTimeout(() => { combineRecordings(); }, 1500);
          }
        } finally {
          setLoading(false);
        }
      };

      // Fire ondataavailable every 30 seconds — each segment is ~240KB at 64kbps
      recorder.start(30000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
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
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    setSessionActive(false);
  };

  // Auto-stop recording after 15 minutes (900 seconds)
  useEffect(() => {
    if (isRecording && recordingTime >= 900) {
      handleStop();
    }
  }, [recordingTime, isRecording]);

  const startNextChunk = () => {
    setShowNextChunkPrompt(false);
    setCurrentChunk(prev => prev + 1);
    setIsChunkCompleted(false);
    // Auto-start the next chunk after a short delay
    setTimeout(() => {
      handleStart();
    }, 500);
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
    // Use ref to avoid stale React state — ref is updated synchronously in setTranscriptChunks callback
    const chunks = transcriptChunksRef.current;
    console.log(`📋 combineRecordings called — ${chunks.length} chunk(s) in ref`);
    const successfulChunks = chunks
      .filter(chunk => chunk.success)
      .sort((a, b) => a.index - b.index);
    
    const combinedTranscript = successfulChunks
      .map(chunk => chunk.transcript)
      .join(' ');
    
    const combinedRawTranscript = successfulChunks
      .map(chunk => chunk.rawTranscript)
      .join(' ');
    
    setTranscript(combinedTranscript);
    setRawTranscript(combinedRawTranscript);
    
    // Notify parent component about combined transcript
    onTranscriptGenerated?.(combinedTranscript, combinedRawTranscript, patientLanguage, docLanguage);
    
    // Scroll to SOAP generator
    const soapSection = document.querySelector('[data-soap-generator]');
    if (soapSection) {
      soapSection.scrollIntoView({ behavior: 'smooth' });
      const event = new CustomEvent('loadTranscript', { 
        detail: { transcript: combinedTranscript, rawTranscript: combinedRawTranscript } 
      });
      window.dispatchEvent(event);
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for current chunk
  const chunkProgress = (recordingTime / 900) * 100; // 900 seconds = 15 minutes

  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto">
      {/* Waveform Visualization */}
      <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
            Live Audio
          </h3>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] px-1.5 py-0">
            Real-time
          </Badge>
        </div>
        <canvas 
          ref={canvasRef} 
          className="w-full h-20 bg-white/50 rounded-lg border border-indigo-200/50"
          width={600}
          height={80}
        />
        
        {/* Language + Chunk progress — compact row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] px-1.5 py-0">
            Patient: {languageNames[patientLanguage] || patientLanguage.toUpperCase()}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0">
            Doc: {languageNames[docLanguage] || docLanguage.toUpperCase()}
          </Badge>
          <span className="ml-auto text-[10px] font-medium text-gray-500">
            Chunk {currentChunk}/4 · {formatTime(recordingTime)}
          </span>
        </div>
        <Progress value={chunkProgress} className="h-1.5 mt-1.5" />
        
        {/* Recording timer */}
        {isRecording && (
          <div className="flex items-center justify-center mt-2 gap-1.5 text-red-600 text-xs font-medium">
            <Timer className="h-3.5 w-3.5 animate-pulse" />
            <span>Chunk {currentChunk}: {formatTime(recordingTime)}</span>
            {recordingTime >= 840 && (
              <span className="text-orange-600 text-[10px]">(Near limit)</span>
            )}
          </div>
        )}
        
        {/* Progress message */}
        {progressMessage && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <span className="text-xs font-medium text-blue-800">{progressMessage}</span>
          </div>
        )}
        
        {/* All chunks completed message */}
        {totalChunks >= 4 && !isRecording && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5" />
            <span className="text-xs font-medium text-green-800">All chunks recorded.</span>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-2 flex-wrap">
        {!isRecording ? (
          !showNextChunkPrompt ? (
            <Button
              onClick={handleStart}
              disabled={loading || totalChunks >= 4}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl shadow-sm transition-all"
            >
              <Mic className="h-4 w-4" />
              {loading ? 'Transcribing...' : totalChunks >= 4 ? 'All Chunks Recorded' : `Start Chunk ${currentChunk}`}
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <Button
                onClick={startNextChunk}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-sm transition-all"
              >
                <Play className="h-4 w-4" />
                Next Chunk
              </Button>
              <Button
                onClick={combineRecordings}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-sm transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Combining...
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4" />
                    Combine Chunks
                  </>
                )}
              </Button>
            </div>
          )
        ) : (
          <Button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white rounded-xl shadow-sm transition-all"
          >
            <Square className="h-4 w-4" />
            Stop ({formatTime(recordingTime)})
          </Button>
        )}
        
        {transcript && !showNextChunkPrompt && (
          <Button
            onClick={generateSOAP}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-sm transition-all"
          >
            <Stethoscope className="h-4 w-4" />
            Generate SOAP
          </Button>
        )}
        
        {/* Show Combine button when we have multiple recordings and not showing next chunk prompt */}
        {recordings.length > 1 && !showNextChunkPrompt && (
          <Button
            onClick={combineRecordings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-sm transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Combining...
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4" />
                Combine Final SOAP
              </>
            )}
          </Button>
        )}
      </div>

      {/* Next Chunk Prompt */}
      {showNextChunkPrompt && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-800">Chunk {currentChunk} Completed</h4>
              <p className="text-blue-700 text-sm">
                Would you like to start the next chunk or combine all chunks into a final SOAP note?
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={startNextChunk}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
              >
                <Play className="h-4 w-4" />
                Next Chunk
              </Button>
              <Button
                onClick={() => {
                  setShowNextChunkPrompt(false);
                  combineRecordings();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl"
              >
                <Stethoscope className="h-4 w-4" />
                Combine Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-800 dark:text-red-300">Recording Error</h4>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
              Transcribed Text
            </h3>
            <Button
              onClick={copyTranscript}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2.5"
            >
              {copied ? (
                <CheckCircle className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <div className="max-h-[180px] overflow-y-auto">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{transcript}</p>
          </div>
        </div>
      )}
      
      {/* Show recordings list when we have multiple recordings */}
      {recordings.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Recordings ({recordings.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recordings.map((recording, index) => (
              <div key={recording.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300">Recording {index + 1}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {recording.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Combine all recordings into a single SOAP note using the &quot;Combine into Final SOAP&quot; button above.
          </div>
        </div>
      )}
    </div>
  );
}