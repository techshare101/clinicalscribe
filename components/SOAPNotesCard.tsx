'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FileText } from 'lucide-react';

export default function SOAPNotesCard() {
  const { user, loading: authLoading } = useAuth();
  const [soapNotes, setSoapNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSOAPNotes = async () => {
      try {
        // Get the current user's ID token
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        
        const token = await user.getIdToken();
        
        // Fetch SOAP notes from the API route
        const res = await fetch("/api/soap-notes", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch SOAP notes");
        }
        
        const notesData = await res.json();
        
        // Map to array with IDs and formatted dates
        const soapNotesList = notesData.map((note: any) => ({
          id: note.id,
          ...note,
          // Ensure createdAt is a Date object for proper formatting
          createdAt: note.createdAt?.toDate?.() || new Date(note.createdAt)
        }));
        
        setSoapNotes(soapNotesList);
      } catch (err: any) {
        console.error('Error fetching SOAP notes:', err);
        setError('Failed to load recent SOAP notes');
      } finally {
        setLoading(false);
      }
    };
    
    // ✅ Critical Guard: only fetch after auth resolves
    if (!authLoading && user) {
      fetchSOAPNotes();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);
  
  // Determine status based on note properties
  const getNoteStatus = (note: any) => {
    if (note.autoCombined) {
      return 'Auto-Combined';
    }
    if (note.pdf?.status === 'generated') {
      return 'Final';
    }
    return 'Draft';
  };
  
  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-blue-100 text-blue-700';
      case 'Final':
        return 'bg-green-100 text-green-700';
      case 'Auto-Combined':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (authLoading) return <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden p-5 text-center">Loading SOAP notes…</div>;
  if (!user) return <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden p-5 text-center">Please log in to see your SOAP notes.</div>;

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
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-black text-white drop-shadow-lg">Recent SOAP Notes</h3>
        </div>
      </div>
      
      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500/20 border-t-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm py-3 text-center">{error}</div>
        ) : soapNotes.length === 0 ? (
          <div className="text-gray-500 text-sm py-3 text-center">
            <p className="mb-2">No SOAP notes created yet</p>
            <Link 
              href="/soap" 
              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium"
            >
              Create SOAP Note
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {soapNotes.slice(0, 3).map((note: any) => {
              const status = getNoteStatus(note);
              return (
                <li key={note.id} className="group relative overflow-hidden bg-white/50 rounded-2xl p-4 border border-white/20 hover:bg-white/70 transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md">
                  {/* Gradient Border Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                  
                  <div className="relative flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {note.patientName || note.soap?.patientName || 'Unknown Patient'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(status)}`}>
                          {status}
                        </span>
                        {note.encounterType && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {note.encounterType}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/soap-history#${note.id}`}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium flex-shrink-0 ml-2"
                    >
                      View →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {soapNotes.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-200/50">
            <Link
              href="/soap-history"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
            >
              View All SOAP Notes
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