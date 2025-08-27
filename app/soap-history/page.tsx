'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ExportToEHR } from './_components/ExportToEHR'
import { EhrStatusBadge } from '@/components/EhrStatusBadge'
import { DownloadPdfButton } from '@/components/DownloadPdfButton'
import PatientSearch from '@/components/PatientSearch'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Calendar,
  User,
  AlertTriangle,
  Download,
  ExternalLink,
  Clock,
  Filter,
  Search,
  Sparkles,
  Heart,
  TrendingUp,
  Eye
} from 'lucide-react'

interface SOAPNote {
  id: string
  uid: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  painLevel: string
  aiSuggested: boolean
  redFlag: string | boolean
  createdAt: any
  patientId?: string
  patientName?: string
  fhirExport?: { status?: 'none' | 'exported' | 'failed' }
}

export default function SOAPHistoryPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [soapNotes, setSoapNotes] = useState<SOAPNote[]>([])
  const [filter, setFilter] = useState<'all' | 'flagged' | 'non-flagged' | 'pdf-available'>('all')
  const [filterPatientId, setFilterPatientId] = useState<string | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientOptions, setPatientOptions] = useState<{ id: string; name: string }[]>([])
  const [selectedNote, setSelectedNote] = useState<SOAPNote | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchSOAPNotes = async () => {
      try {
        // Get the current user's ID token
        const token = await user.getIdToken();
        
        // Fetch SOAP notes from the API route
        const res = await fetch("/api/soap-history", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch SOAP notes: ${res.status} ${res.statusText} - ${errorText}`);
        }
        
        const notesData = await res.json();
        
        // Map to array with IDs and formatted dates
        const notesList = notesData.map((note: any) => ({
          id: note.id,
          ...note,
          // Ensure createdAt is a Date object for proper formatting
          createdAt: note.createdAt?.toDate?.() || new Date(note.createdAt)
        }));
        
        setSoapNotes(notesList);
      } catch (err: any) {
        console.error('Error fetching SOAP notes:', err);
        // Optionally, you could set an error state to display to the user
      }
    };
    
    fetchSOAPNotes();
  }, [user, filterPatientId]);

  useEffect(() => {
    // fetch a few patient options for the filter when search changes
    let cancelled = false
    async function run() {
      const s = patientSearch.trim().toLowerCase()
      if (s.length < 2) {
        setPatientOptions([])
        return
      }
      try {
        // For now, we'll just clear the options since we're not implementing patient search
        // This could be enhanced later with a proper API endpoint
        setPatientOptions([])
      } catch {
        if (!cancelled) setPatientOptions([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [patientSearch])

  const isRedFlag = (redFlag: string | boolean): boolean => {
    if (typeof redFlag === 'boolean') {
      return redFlag
    }
    return redFlag === 'true'
  }

  const filteredNotes = soapNotes.filter(note => {
    if (filter === 'flagged') return isRedFlag(note.redFlag)
    if (filter === 'non-flagged') return !isRedFlag(note.redFlag)
    if (filter === 'pdf-available') return (note as any).storagePath || (note as any).pdf?.status === 'generated'
    return true
  })

  const formatDate = (date: any) => {
    if (!date) return 'Unknown'
    // Handle both Firestore timestamps and JavaScript Date objects
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString()
    }
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-300/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative container mx-auto py-8 max-w-7xl px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8"
        >
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent drop-shadow-sm"
            >
              SOAP History
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-gray-600 flex items-center gap-2"
            >
              <FileText className="h-5 w-5 text-blue-500" />
              View and manage your clinical documentation history
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <EhrStatusBadge />
          </motion.div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Filter & Search</h3>
                <p className="text-gray-600">Find specific SOAP notes quickly</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {[
                { key: 'all', label: 'All Notes', icon: '📋', gradient: 'from-gray-500 to-gray-600' },
                { key: 'flagged', label: 'Flagged', icon: '🚨', gradient: 'from-red-500 to-pink-600' },
                { key: 'non-flagged', label: 'Standard', icon: '✅', gradient: 'from-emerald-500 to-green-600' },
                { key: 'pdf-available', label: 'PDF Ready', icon: '📄', gradient: 'from-purple-500 to-indigo-600' }
              ].map((filterBtn) => (
                <Button
                  key={filterBtn.key}
                  onClick={() => setFilter(filterBtn.key as any)}
                  className={`flex items-center gap-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
                    filter === filterBtn.key
                      ? `bg-gradient-to-r ${filterBtn.gradient} text-white shadow-lg`
                      : 'bg-white/70 text-gray-700 hover:bg-white border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{filterBtn.icon}</span>
                  {filterBtn.label}
                </Button>
              ))}
              
              <div className="flex items-center gap-3 ml-auto">
                <div className="w-64">
                  <PatientSearch 
                    onSearch={(term) => {
                      if (term.length === 0) {
                        setFilterPatientId(null)
                        setPatientSearch('')
                      } else {
                        setPatientSearch(term)
                      }
                    }}
                    placeholder="Search patients..."
                    className="mb-0"
                  />
                </div>
                
                {filterPatientId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setFilterPatientId(null); setPatientSearch('') }}
                    className="rounded-xl"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        {/* SOAP Notes Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          {filteredNotes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16 space-y-8"
            >
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
                className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-blue-200/50"
              >
                <Search className="h-10 w-10 text-white" />
              </motion.div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  No SOAP Notes Found
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                  No clinical documentation matches your current filter criteria
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence>
                {filteredNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group relative overflow-hidden"
                  >
                    {/* Gradient Border Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" />
                    
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 p-8 group-hover:-translate-y-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                              <FileText className="h-7 w-7" />
                            </div>
                            {isRedFlag(note.redFlag) && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                <AlertTriangle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                              {note.patientName || 'Unknown Patient'}
                              <Badge className={`${isRedFlag(note.redFlag) ? 'bg-red-500' : 'bg-emerald-500'} text-white border-0`}>
                                {isRedFlag(note.redFlag) ? 'Flagged' : 'Standard'}
                              </Badge>
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(note.createdAt)}
                              </div>
                              {note.patientId && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  PID: {note.patientId}
                                </div>
                              )}
                              {note.painLevel && (
                                <Badge variant="outline" className="text-xs">
                                  Pain: {note.painLevel}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {((note as any).storagePath || (note as any).pdf?.status === 'generated') && (
                            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedNote(note)}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-black bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                                  SOAP Note Details
                                </DialogTitle>
                              </DialogHeader>
                              {selectedNote && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-2xl p-6">
                                      <h3 className="font-black mb-4 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        Audit Information
                                      </h3>
                                      <div className="space-y-2 text-sm">
                                        <div><span className="font-semibold">Created:</span> {formatDate(selectedNote.createdAt)}</div>
                                        <div><span className="font-semibold">User ID:</span> {selectedNote.uid}</div>
                                      </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-2xl p-6">
                                      <h3 className="font-black mb-4 flex items-center gap-2">
                                        <Heart className="h-5 w-5 text-red-500" />
                                        Clinical Information
                                      </h3>
                                      <div className="space-y-2 text-sm">
                                        <div><span className="font-semibold">Pain Level:</span> {selectedNote.painLevel || 'Not recorded'}</div>
                                        <div><span className="font-semibold">AI Suggested:</span> {selectedNote.aiSuggested ? 'Yes' : 'No'}</div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">Red Flag:</span>
                                          <Badge className={`${isRedFlag(selectedNote.redFlag) ? 'bg-red-500' : 'bg-emerald-500'} text-white border-0`}>
                                            {isRedFlag(selectedNote.redFlag) ? 'Yes' : 'No'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    {[
                                      { title: 'Subjective', content: selectedNote.subjective, color: 'emerald' },
                                      { title: 'Objective', content: selectedNote.objective, color: 'blue' },
                                      { title: 'Assessment', content: selectedNote.assessment, color: 'purple' },
                                      { title: 'Plan', content: selectedNote.plan, color: 'orange' }
                                    ].map((section) => (
                                      <div key={section.title} className={`bg-${section.color}-50 rounded-2xl p-6 border-l-4 border-${section.color}-500`}>
                                        <h3 className="font-black mb-3 text-lg">{section.title}</h3>
                                        <div className="text-gray-800 leading-relaxed">
                                          {section.content}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="pt-6 border-t border-gray-200 space-y-4">
                                    <ExportToEHR
                                      note={{
                                        id: selectedNote.id,
                                        subjective: selectedNote.subjective,
                                        objective: selectedNote.objective,
                                        assessment: selectedNote.assessment,
                                        plan: selectedNote.plan,
                                        createdAt: selectedNote.createdAt,
                                        patientName: (selectedNote as any).patientName,
                                      }}
                                      patient={(selectedNote as any).patientId || (selectedNote as any).patientName ? {
                                        id: (selectedNote as any).patientId,
                                        name: (selectedNote as any).patientName,
                                      } : undefined}
                                      author={undefined}
                                      attachment={undefined}
                                    />
                                    {(selectedNote as any).storagePath && (
                                      <DownloadPdfButton pdfPath={(selectedNote as any).storagePath} />
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-l-4 border-blue-500">
                          <h4 className="font-bold text-blue-900 mb-2">Assessment</h4>
                          <p className="text-blue-800 text-sm leading-relaxed line-clamp-2">
                            {note.assessment}
                          </p>
                        </div>
                        
                        {/* Status Indicators */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3">
                            <Badge className={`${
                              (note as any).storagePath || (note as any).pdf?.status === 'generated' 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            } border font-semibold`}>
                              {(note as any).storagePath || (note as any).pdf?.status === 'generated' ? '📄 PDF Ready' : '— No PDF'}
                            </Badge>
                            <Badge className={`${
                              note.fhirExport?.status === 'exported' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              note.fhirExport?.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-gray-100 text-gray-600 border-gray-200'
                            } border font-semibold`}>
                              🔗 {note.fhirExport?.status || 'none'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {note.aiSuggested && (
                              <div className="flex items-center gap-1">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                <span>AI Generated</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}