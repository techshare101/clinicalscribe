'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Clock, AlertTriangle } from 'lucide-react';

export default function SessionsCard() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Get the current user's ID token
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        
        const token = await user.getIdToken();
        
        // Fetch sessions from the API route
        const res = await fetch("/api/sessions", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch sessions");
        }
        
        const sessionsData = await res.json();
        
        // Map to array with IDs and formatted dates
        const sessionsList = sessionsData.map((session: any) => ({
          id: session.id,
          ...session,
          // Ensure createdAt is a Date object for proper formatting
          createdAt: session.createdAt?.toDate?.() || new Date(session.createdAt)
        }));
        
        setSessions(sessionsList);
      } catch (err: any) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load recent sessions');
      } finally {
        setLoading(false);
      }
    };
    
    // ✅ Critical Guard: only fetch after auth resolves
    if (!authLoading && user) {
      fetchSessions();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);
  
  // Format date to a more readable format
  const formatDate = (date: Date) => {
    return date.toLocaleString(); // Simple full date/time formatting as per the requirement
  };

  if (authLoading) return <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden p-5 text-center">Loading sessions…</div>;
  if (!user) return <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden p-5 text-center">Please log in to see your sessions.</div>;

  return (
    <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 p-5 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl ring-2 ring-white/30">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-black text-white drop-shadow-lg">Recent Sessions</h3>
        </div>
      </div>
      
      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500/20 border-t-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm py-3 text-center">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-500 text-sm py-3 text-center">
            <p className="mb-2">No sessions recorded yet</p>
            <Link 
              href="/transcription" 
              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium"
            >
              Start Recording
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {sessions.slice(0, 3).map((session: any) => (
              <li key={session.id} className="group relative overflow-hidden bg-white/50 rounded-2xl p-4 border border-white/20 hover:bg-white/70 transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                {/* Gradient Border Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                
                <div className="relative flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {session.patientName || 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {formatDate(session.createdAt)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {session.recordings?.length || 0} recordings
                      </span>
                      {session.autoCombined && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Auto-Combined
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/patient/sessions/${session.id}`}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium flex-shrink-0 ml-2"
                  >
                    View →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {sessions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-200/50">
            <Link
              href="/patient/sessions"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
            >
              View All Sessions
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}