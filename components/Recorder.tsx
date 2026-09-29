'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { transcribeAudio } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { uploadAudioFile } from '@/lib/audioUpload';
import { languageNames } from '@/lib/languageUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { toast } from '@/lib/toast';
import { stitchTranscriptChunks, cleanTranscriptBeforeSoap } from '@/lib/medical-normalize';

interface RecorderProps {
  onTranscriptGenerated?: (transcript: string, rawTranscript: string, patientLang?: string, docLang?: string) => void;
  patientLanguage?: string;
  docLanguage?: string;
  sessionId?: string; // Add session ID for backend storage
  resetSignal?: number; // Increment to trigger full reset from parent
}

interface RecordingChunk {
  id: string;
  transcript: string;
  timestamp: Date;
  audioUrl?: string;
  duration?: number;
}

export default function Recorder({ 
  onTranscriptGenerated, 
  patientLanguage = "auto", 
  docLanguage = "en",
  sessionId,
  resetSignal = 0,
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [transcript, setTranscript] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [inFlightCount, setInFlightCount] = useState(0);
  const inFlightCountRef = useRef(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [recordings, setRecordings] = useState<RecordingChunk[]>([]);

  // Waveform visualization refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const maxVolumeRef = useRef<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Master audio recording (uninterrupted continuous session)
  const masterRecorderRef = useRef<MediaRecorder | null>(null);
  const masterAudioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm;codecs=opus");

  // Rolling overlapping chunk recording
  // 20s chunk duration, 2s overlap with consecutive chunk -> step is 18s
  const CHUNK_DURATION_MS = 20000;
  const CHUNK_OVERLAP_MS = 2000;
  const CHUNK_STEP_MS = CHUNK_DURATION_MS - CHUNK_OVERLAP_MS; // 18000ms

  const activeChunkRecordersRef = useRef<Map<number, MediaRecorder>>(new Map());
  const chunkTimerIdsRef = useRef<NodeJS.Timeout[]>([]);
  const nextChunkIndexRef = useRef<number>(0);
  const chunkMapRef = useRef<Map<number, { transcript: string; rawTranscript: string }>>(new Map());
  const pendingPromisesRef = useRef<Promise<void>[]>([]);
  const liveTextRef = useRef<string>('');
  const liveRawRef = useRef<string>('');

  // Function to toggle session active state in Firestore
  const setSessionActive = async (active: boolean) => {
    if (!sessionId) return;
    try {
      const sessionRef = doc(db, 'patientSessions', sessionId);
      await updateDoc(sessionRef, { isActive: active });
    } catch (err) {
      console.error(`Error ${active ? 'activating' : 'deactivating'} session:`, err);
    }
  };

  // Reset all state when parent triggers resetSignal
  useEffect(() => {
    if (resetSignal > 0) {
      setTranscript('');
      setRawTranscript('');
      liveTextRef.current = '';
      liveRawRef.current = '';
      setRecordings([]);
      setError(null);
      setRecordingTime(0);
      setProgressMessage('');
      setInFlightCount(0);
      inFlightCountRef.current = 0;
      chunkMapRef.current.clear();
      pendingPromisesRef.current = [];
    }
  }, [resetSignal]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      chunkTimerIdsRef.current.forEach(t => clearTimeout(t));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

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

  const setupVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      
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

        let currentPeak = 0;
        for (let j = 0; j < bufferLength; j++) {
          if (dataArray[j] > currentPeak) currentPeak = dataArray[j];
        }
        if (currentPeak > maxVolumeRef.current) {
          maxVolumeRef.current = currentPeak;
        }
        
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

  // Re-stitch all consecutive completed chunks starting from 0 and update state
  const updateLiveTranscript = useCallback(() => {
    const orderedTexts: string[] = [];
    const orderedRaws: string[] = [];
    
    let i = 0;
    while (chunkMapRef.current.has(i)) {
      const item = chunkMapRef.current.get(i)!;
      if (item.transcript && item.transcript.trim()) {
        orderedTexts.push(item.transcript.trim());
      }
      if (item.rawTranscript && item.rawTranscript.trim()) {
        orderedRaws.push(item.rawTranscript.trim());
      }
      i++;
    }

    if (orderedTexts.length > 0) {
      const stitched = stitchTranscriptChunks(orderedTexts);
      const stitchedRaw = stitchTranscriptChunks(orderedRaws);
      
      liveTextRef.current = stitched;
      liveRawRef.current = stitchedRaw;
      setTranscript(stitched);
      setRawTranscript(stitchedRaw);

      onTranscriptGenerated?.(
        stitched,
        stitchedRaw,
        patientLanguage !== 'auto' ? patientLanguage : undefined,
        docLanguage
      );
    }
  }, [onTranscriptGenerated, patientLanguage, docLanguage]);

  // Pipelined upload: dispatch chunk transcription immediately without waiting for previous chunks
  const dispatchChunkTranscription = useCallback((blob: Blob, index: number) => {
    inFlightCountRef.current++;
    setInFlightCount(inFlightCountRef.current);

    const promise = (async () => {
      try {
        console.log(`🚀 [Pipeline] Uploading chunk ${index} (${(blob.size / 1024).toFixed(1)} KB) — in-flight: ${inFlightCountRef.current}`);
        const res = await transcribeAudio(blob, patientLanguage, docLanguage, index);
        if (res && res.transcript) {
          chunkMapRef.current.set(index, {
            transcript: res.transcript,
            rawTranscript: res.rawTranscript
          });
          console.log(`✅ [Pipeline] Chunk ${index} transcribed (${res.transcript.length} chars)`);
        } else {
          chunkMapRef.current.set(index, { transcript: '', rawTranscript: '' });
          console.log(`⚠️ [Pipeline] Chunk ${index} returned empty text`);
        }
      } catch (err: any) {
        console.error(`❌ [Pipeline] Chunk ${index} transcription failed:`, err);
        chunkMapRef.current.set(index, { transcript: '', rawTranscript: '' });
      } finally {
        inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
        setInFlightCount(inFlightCountRef.current);
        updateLiveTranscript();
      }
    })();

    pendingPromisesRef.current.push(promise);
  }, [patientLanguage, docLanguage, updateLiveTranscript]);

  // Schedule overlapping chunk recorders on the continuous hardware MediaStream
  const scheduleNextChunk = useCallback((index: number) => {
    if (!isRecordingRef.current || !streamRef.current) return;

    try {
      const mimeType = mimeTypeRef.current;
      const bitsPerSecond = process.env.NODE_ENV === 'production' ? 64000 : 128000;
      const chunkRecorder = new MediaRecorder(streamRef.current, { mimeType, bitsPerSecond });
      activeChunkRecordersRef.current.set(index, chunkRecorder);
      const chunks: Blob[] = [];

      chunkRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      chunkRecorder.onstop = () => {
        activeChunkRecordersRef.current.delete(index);
        if (chunks.length > 0) {
          const chunkBlob = new Blob(chunks, { type: mimeType });
          if (chunkBlob.size > 1000) {
            dispatchChunkTranscription(chunkBlob, index);
          }
        }
      };

      chunkRecorder.start();
      console.log(`🎙️ [Overlap] Started chunk recorder ${index}`);

      // Schedule stop for this chunk at CHUNK_DURATION_MS (20s)
      const stopTimer = setTimeout(() => {
        if (chunkRecorder.state !== 'inactive') {
          try {
            chunkRecorder.stop();
          } catch (e) {
            console.debug(`Error stopping chunk ${index}:`, e);
          }
        }
      }, CHUNK_DURATION_MS);
      chunkTimerIdsRef.current.push(stopTimer);

      // Schedule next chunk to start at CHUNK_STEP_MS (18s)
      // This produces exactly CHUNK_OVERLAP_MS (2s) of acoustic overlap!
      const nextStartTimer = setTimeout(() => {
        if (isRecordingRef.current) {
          const nextIndex = nextChunkIndexRef.current++;
          scheduleNextChunk(nextIndex);
        }
      }, CHUNK_STEP_MS);
      chunkTimerIdsRef.current.push(nextStartTimer);

    } catch (err) {
      console.error(`Error scheduling chunk ${index}:`, err);
    }
  }, [CHUNK_DURATION_MS, CHUNK_STEP_MS, dispatchChunkTranscription]);

  const handleStart = async () => {
    try {
      setError(null);
      setRecordingTime(0);
      maxVolumeRef.current = 0;
      chunkMapRef.current.clear();
      pendingPromisesRef.current = [];
      activeChunkRecordersRef.current.clear();
      chunkTimerIdsRef.current.forEach(t => clearTimeout(t));
      chunkTimerIdsRef.current = [];
      nextChunkIndexRef.current = 0;
      inFlightCountRef.current = 0;
      setInFlightCount(0);
      setProgressMessage('');

      // Request continuous microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Determine supported mime type
      let mimeType = "audio/webm;codecs=opus";
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
                 : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4"
                 : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "audio/ogg;codecs=opus"
                 : "";
      }
      mimeTypeRef.current = mimeType;

      const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
      const bitsPerSecond = isProduction ? 64000 : 128000;

      // Start uninterrupted master recorder for full encounter archive
      masterAudioChunksRef.current = [];
      const masterRecorder = new MediaRecorder(stream, { mimeType, bitsPerSecond });
      masterRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          masterAudioChunksRef.current.push(e.data);
        }
      };
      masterRecorder.start(5000); // Flush slices every 5s into buffer
      masterRecorderRef.current = masterRecorder;

      // Mark recording active
      setIsRecording(true);
      isRecordingRef.current = true;

      // Timer ticker
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Launch rolling overlapping chunk pipeline (starts chunk 0, auto-chains subsequent chunks)
      const firstChunkIndex = nextChunkIndexRef.current++;
      scheduleNextChunk(firstChunkIndex);

      await setSessionActive(true);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      setError('Please allow microphone access to use live transcription.');
    }
  };

  const handleStop = async () => {
    setIsRecording(false);
    isRecordingRef.current = false;

    // Clear upcoming timers
    chunkTimerIdsRef.current.forEach(t => clearTimeout(t));
    chunkTimerIdsRef.current = [];

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop all currently active chunk recorders immediately to flush remaining audio
    activeChunkRecordersRef.current.forEach((rec, idx) => {
      if (rec.state !== 'inactive') {
        try {
          rec.stop();
        } catch (e) {
          console.debug(`Error stopping active chunk ${idx}:`, e);
        }
      }
    });

    // Stop master recorder
    if (masterRecorderRef.current && masterRecorderRef.current.state !== 'inactive') {
      try {
        masterRecorderRef.current.stop();
      } catch (e) {
        console.debug('Error stopping master recorder:', e);
      }
    }

    // Safely stop continuous stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setLoading(true);
    setProgressMessage('Finalizing transcription...');

    // Wait for all in-flight and partial chunk uploads in the pipeline to settle
    await Promise.allSettled(pendingPromisesRef.current);

    // Final stitch of all chunks
    updateLiveTranscript();

    let finalText = liveTextRef.current;
    let finalRaw = liveRawRef.current;

    // Fallback: If no text generated from chunks, transcribe the master recording
    if (!finalText.trim() && masterAudioChunksRef.current.length > 0) {
      try {
        console.log('🔄 Fallback transcription on master recording...');
        const fullBlob = new Blob(masterAudioChunksRef.current, { type: mimeTypeRef.current });
        if (fullBlob.size > 2000) {
          const fallbackRes = await transcribeAudio(fullBlob, patientLanguage, docLanguage, 0);
          if (fallbackRes.transcript.trim()) {
            finalText = fallbackRes.transcript;
            finalRaw = fallbackRes.rawTranscript;
          }
        }
      } catch (fallbackErr) {
        console.error('Master audio fallback failed:', fallbackErr);
      }
    }

    // Apply medical normalization & hallucination stripping
    const cleanedTranscript = cleanTranscriptBeforeSoap(finalText);
    const cleanedRaw = cleanTranscriptBeforeSoap(finalRaw);

    setTranscript(cleanedTranscript);
    setRawTranscript(cleanedRaw);
    liveTextRef.current = cleanedTranscript;
    liveRawRef.current = cleanedRaw;

    if (!cleanedTranscript.trim()) {
      if (maxVolumeRef.current < 5) {
        setError('No audio signal detected from microphone. Please ensure your microphone is unmuted and input volume is up.');
      } else {
        setError('No speech detected in this recording. Please speak clearly into your microphone.');
      }
    } else {
      // Save full session recording to backend
      const newRecording: RecordingChunk = {
        id: Date.now().toString(),
        transcript: cleanedTranscript,
        timestamp: new Date(),
        duration: recordingTime,
      };
      setRecordings(prev => [...prev, newRecording]);

      // Save to Firebase Storage if sessionId provided
      if (sessionId && masterAudioChunksRef.current.length > 0) {
        const fullAudioBlob = new Blob(masterAudioChunksRef.current, { type: mimeTypeRef.current });
        uploadAudioFile(fullAudioBlob, sessionId).catch(err =>
          console.error('Audio upload failed:', err)
        );
      }

      // Save chunk to Firestore
      if (sessionId && auth.currentUser) {
        try {
          const chunkRef = doc(collection(db, 'transcriptions', auth.currentUser.uid, sessionId));
          await setDoc(chunkRef, {
            transcript: cleanedTranscript,
            rawTranscript: cleanedRaw,
            patientLang: patientLanguage,
            docLang: docLanguage,
            createdAt: new Date(),
            status: 'completed'
          });
        } catch (saveError) {
          console.error('Error saving chunk to Firestore:', saveError);
        }
      }

      // Notify parent component
      onTranscriptGenerated?.(
        cleanedTranscript,
        cleanedRaw,
        patientLanguage !== 'auto' ? patientLanguage : undefined,
        docLanguage
      );
    }

    setLoading(false);
    setProgressMessage('');
    setSessionActive(false);
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      toast({ message: 'Transcript copied to clipboard', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({ message: 'Failed to copy to clipboard', variant: 'error' });
    }
  };

  const generateSOAP = () => {
    const soapSection = document.querySelector('[data-soap-generator]');
    if (soapSection) {
      soapSection.scrollIntoView({ behavior: 'smooth' });
      const event = new CustomEvent('loadTranscript', { 
        detail: { transcript, rawTranscript } 
      });
      window.dispatchEvent(event);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto">
      {/* Waveform Visualization & Session Status */}
      <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl p-3 border border-indigo-100/50 dark:border-indigo-900/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}></div>
            {isRecording ? 'Continuous Live Encounter' : 'Live Audio'}
          </h3>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800 text-[10px] px-1.5 py-0">
            {isRecording ? 'Gapless Overlap' : 'Real-time'}
          </Badge>
        </div>
        <canvas 
          ref={canvasRef} 
          className="w-full h-20 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50"
          width={600}
          height={80}
        />
        
        {/* Language badges + continuous duration ticker */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[10px] px-1.5 py-0">
            Patient: {languageNames[patientLanguage] || patientLanguage.toUpperCase()}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] px-1.5 py-0">
            Doc: {languageNames[docLanguage] || docLanguage.toUpperCase()}
          </Badge>
          <span className="ml-auto text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Timer className={`h-3.5 w-3.5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            {formatTime(recordingTime)}
          </span>
        </div>
        
        {/* Progress or finalizing feedback */}
        {progressMessage && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-300 flex items-center justify-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progressMessage}
            </span>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isRecording ? (
          <Button
            onClick={handleStart}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl shadow-sm transition-all font-medium"
          >
            <Mic className="h-4 w-4" />
            {loading ? 'Finalizing...' : 'Start Recording'}
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-gradient-to-r from-gray-800 to-gray-950 hover:from-black hover:to-black text-white rounded-xl shadow-sm transition-all font-medium"
          >
            <Square className="h-4 w-4 text-red-400 fill-red-400" />
            Stop Recording ({formatTime(recordingTime)})
          </Button>
        )}
        
        {transcript && (
          <Button
            onClick={generateSOAP}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-sm transition-all"
          >
            <Stethoscope className="h-4 w-4" />
            Generate SOAP
          </Button>
        )}
      </div>

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

      {/* Live Transcript Display with Inline Transcribing Indicator */}
      {(transcript || isRecording) && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              Live Transcript
              {isRecording && (
                <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400 ml-1">
                  (Continuous)
                </span>
              )}
            </h3>
            {transcript && (
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
            )}
          </div>
          <div className="max-h-[200px] overflow-y-auto pr-1">
            {transcript ? (
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {transcript}
                {inFlightCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium ml-2 animate-pulse bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 align-middle">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    transcribing…
                  </span>
                )}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 italic py-2">
                {inFlightCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Transcribing first audio segment…
                  </span>
                ) : (
                  <span>Listening... Speak clearly into your microphone.</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recordings history */}
      {recordings.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-sm">Encounter Recordings ({recordings.length})</h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {recordings.map((recording, index) => (
              <div key={recording.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">Take {index + 1}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {recording.timestamp.toLocaleTimeString()} ({formatTime(recording.duration || 0)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
