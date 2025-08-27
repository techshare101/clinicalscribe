"use client";

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  FileText, 
  Download, 
  Calendar,
  Play,
  Copy,
  Sparkles
} from 'lucide-react';
import RecordingsList from '@/components/RecordingsList';
import { getAudioUrl } from '@/lib/getAudioUrl';
import AutoCombineBanner from '@/components/AutoCombineBanner';
import AutoCombineRetry from '@/components/AutoCombineRetry';

interface Recording {
  id: string;
  transcript: string;
  timestamp: any;
  audioUrl?: string;
}

interface SessionData {
  id: string;
  patientName?: string;
  encounterType?: string;
  createdAt: any;
  recordings: Recording[];
  finalSoap?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  transcript?: string;
  soapNote?: string;
  pdfUrl?: string;
  totalDuration?: number;
  autoCombined?: boolean;
  autoCombinedAt?: string;
}

export default function PatientSessionDetail({ params }: { params: { id: string } }) {
  const { profile, isLoading } = useProfile();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        if (!profile?.uid) return;
        
        // Fetch the session document from patientSessions collection
        const sessionRef = doc(db, 'patientSessions', params.id);
        const sessionSnap = await getDoc(sessionRef);
        
        if (!sessionSnap.exists()) {
          // Try to find in reports collection as fallback
          const reportsQuery = query(
            collection(db, 'reports'),
            where('userId', '==', profile.uid)
          );
          const reportsSnap = await getDocs(reportsQuery);
          
          const foundDoc = reportsSnap.docs.find(doc => doc.id === params.id);
          if (!foundDoc) {
            setError('Session not found');
            setLoading(false);
            return;
          }
          
          setSessionData({
            id: foundDoc.id,
            ...foundDoc.data()
          } as SessionData);
        } else {
          setSessionData({
            id: sessionSnap.id,
            ...sessionSnap.data()
          } as SessionData);
        }
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    if (profile?.uid) {
      fetchSessionData();
    }
  }, [params.id, profile?.uid]);

  // Fetch signed URLs for recordings
  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (!sessionData?.recordings?.length || !auth.currentUser) return;
      
      try {
        const updatedRecordings = [...sessionData.recordings];
        let hasChanges = false;
        
        // Fetch signed URLs for each recording that might have audio
        for (let i = 0; i < updatedRecordings.length; i++) {
          const recording = updatedRecordings[i];
          // Only fetch signed URL if we have an audio URL (storage path)
          if (recording.audioUrl && !recording.audioUrl.startsWith('http')) {
            try {
              const signedUrl = await getAudioUrl(recording.audioUrl);
              updatedRecordings[i].audioUrl = signedUrl;
              hasChanges = true;
            } catch (err) {
              console.error('Error fetching signed URL for recording:', err);
            }
          }
        }
        
        // Only update state if we made changes
        if (hasChanges) {
          setSessionData(prev => prev ? {
            ...prev,
            recordings: updatedRecordings
          } : null);
        }
      } catch (err) {
        console.error('Error fetching signed URLs:', err);
      }
    };

    fetchSignedUrls();
  }, [sessionData?.recordings]);

  const handleCombine = async () => {
    try {
      const res = await fetch("/api/soap/combine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: params.id }),
      });
      const data = await res.json();
      if (data.finalSoap) {
        // Update the session data with the combined SOAP note
        setSessionData(prev => prev ? {
          ...prev,
          finalSoap: data
        } : null);
      }
    } catch (err) {
      console.error('Error combining recordings:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-6">The requested session could not be found.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="p-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/30 hover:bg-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-800 bg-clip-text text-transparent">
                Session Details
              </h1>
              <p className="text-gray-600">
                {sessionData.patientName || 'Unknown Patient'} • {sessionData.encounterType || 'General Consultation'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Session Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden"
        >
          {/* Auto-Combine Banner */}
          {sessionData.autoCombined && (
            <div className="mb-0">
              <AutoCombineBanner 
                sessionId={sessionData.id} 
                autoCombinedAt={sessionData.autoCombinedAt} 
                showLink={false}
              />
            </div>
          )}
          
          {/* Auto-Combine Retry - Show if totalDuration ≥ 120 min but no finalSoap */}
          {sessionData.totalDuration && sessionData.totalDuration >= 7200 && !sessionData.finalSoap && (
            <div className="mb-0">
              <AutoCombineRetry 
                sessionId={sessionData.id} 
                onSuccess={() => {
                  // Will reload the page after success
                }}
              />
            </div>
          )}
          <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl ring-2 ring-white/30">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {sessionData.patientName || 'Unknown Patient'}
                  </h2>
                  <p className="text-gray-300 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {sessionData.createdAt?.toDate ? 
                      sessionData.createdAt.toDate().toLocaleString() : 
                      new Date(sessionData.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                  {sessionData.encounterType || 'General Consultation'}
                </div>
                <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                  {sessionData.recordings?.length || 0} Recordings
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Content Sections */}
            <div className="space-y-6">
              {/* Original Transcript (if available) */}
              {sessionData.transcript && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-6 border-l-4 border-emerald-400 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/30 rounded-full -mr-10 -mt-10" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <span className="text-emerald-600 text-lg">🎤</span>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-800 text-sm uppercase tracking-wide">Audio Transcript</span>
                        <div className="text-xs text-emerald-600 flex items-center gap-1">
                          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                          Voice Recognition
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(sessionData.transcript || '')}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors duration-200"
                    >
                      <Copy className="h-4 w-4 text-emerald-600" />
                    </button>
                  </div>
                  <p className="text-emerald-800 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                    {sessionData.transcript}
                  </p>
                </motion.div>
              )}

              {/* Original SOAP Note (if available) */}
              {sessionData.soapNote && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 rounded-2xl p-6 border-l-4 border-blue-400 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -mr-10 -mt-10" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <span className="text-blue-600 text-lg">📝</span>
                      </div>
                      <div>
                        <span className="font-bold text-blue-800 text-sm uppercase tracking-wide">SOAP Note</span>
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                          AI Generated
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(sessionData.soapNote || '')}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors duration-200"
                    >
                      <Copy className="h-4 w-4 text-blue-600" />
                    </button>
                  </div>
                  <p className="text-blue-800 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                    {sessionData.soapNote}
                  </p>
                </motion.div>
              )}

              {/* Combined Final SOAP Note (if available) */}
              {sessionData.finalSoap && (
                <motion.div 
                  id="finalSoap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl p-6 border-l-4 border-purple-400 shadow-sm hover:shadow-md transition-shadow duration-300 scroll-mt-16"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -mr-10 -mt-10" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <span className="text-purple-600 text-lg">📋</span>
                      </div>
                      <div>
                        <span className="font-bold text-purple-800 text-sm uppercase tracking-wide">Final Combined SOAP Note</span>
                        <div className="text-xs text-purple-600 flex items-center gap-1">
                          <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                          AI Generated from Multiple Recordings
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(
                        `Subjective:\n${sessionData.finalSoap?.subjective || ''}\n\nObjective:\n${sessionData.finalSoap?.objective || ''}\n\nAssessment:\n${sessionData.finalSoap?.assessment || ''}\n\nPlan:\n${sessionData.finalSoap?.plan || ''}`
                      )}
                      className="p-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-colors duration-200"
                    >
                      <Copy className="h-4 w-4 text-purple-600" />
                    </button>
                  </div>
                  <div className="space-y-3 text-purple-800 text-sm leading-relaxed font-medium">
                    <div>
                      <span className="font-semibold">Subjective:</span>
                      <p className="ml-2">{sessionData.finalSoap.subjective}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Objective:</span>
                      <p className="ml-2">{sessionData.finalSoap.objective}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Assessment:</span>
                      <p className="ml-2">{sessionData.finalSoap.assessment}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Plan:</span>
                      <p className="ml-2">{sessionData.finalSoap.plan}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PDF Download (if available) */}
              {sessionData.pdfUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-6 border-l-4 border-amber-400 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 rounded-full -mr-10 -mt-10" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 rounded-xl">
                        <span className="text-amber-600 text-lg">📄</span>
                      </div>
                      <div>
                        <span className="font-bold text-amber-800 text-sm uppercase tracking-wide">PDF Document</span>
                        <div className="text-xs text-amber-600 flex items-center gap-1">
                          <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                          Ready for Download
                        </div>
                      </div>
                    </div>
                    <a 
                      href={sessionData.pdfUrl} 
                      target="_blank" 
                      className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white rounded-xl text-sm font-bold hover:from-amber-700 hover:via-orange-700 hover:to-red-700 transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Download className="h-4 w-4 group-hover:animate-bounce" />
                      Download
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Recordings List */}
              <RecordingsList 
                recordings={sessionData.recordings || []} 
                onCombine={handleCombine} 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}