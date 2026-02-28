'use client'

import { useState, useEffect, useCallback } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Eye,
  Share2,
  Trash2,
  Stethoscope,
  X,
  Loader2,
} from 'lucide-react'
import { formatDate } from '@/lib/formatDate'
import { formatRelativeTime } from '@/lib/formatRelativeTime'

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

// Inline quick-export button
function ExportToEHRInline({ note }: { note: SOAPNote }) {
  const [loading, setLoading] = useState(false)
  const [exported, setExported] = useState(note.fhirExport?.status === 'exported')

  async function handleQuickExport(e: React.MouseEvent) {
    e.stopPropagation()
    if (loading || exported) return
    setLoading(true)
    try {
      const buildRes = await fetch('/api/fhir/document-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soap: {
            subjective: note.subjective,
            objective: note.objective,
            assessment: note.assessment,
            plan: note.plan,
            patientName: note.patientName,
            timestamp: note.createdAt?.seconds
              ? new Date(note.createdAt.seconds * 1000).toISOString()
              : new Date().toISOString(),
          },
        }),
      })
      if (!buildRes.ok) throw new Error('Failed to build FHIR resource')
      const docRef = await buildRes.json()
      const postRes = await fetch('/api/smart/post-document-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docRef),
      })
      const postData = await postRes.json().catch(() => ({}))
      const posted = postRes.ok && postData.posted
      await fetch('/api/notes/fhir-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          status: posted ? 'exported' : 'failed',
          docRef,
          posted,
          remote: posted ? { server: postData.server, resourceId: postData.resourceId } : null,
        }),
      })
      if (posted) setExported(true)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (exported) {
    return (
      <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[10px]">
        <Share2 className="h-3 w-3 mr-1" /> Exported
      </Badge>
    )
  }

  return (
    <button
      onClick={handleQuickExport}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 hover:text-teal-900 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
      {loading ? 'Exporting' : 'Export EHR'}
    </button>
  )
}

export default function SOAPHistoryPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [soapNotes, setSoapNotes] = useState<SOAPNote[]>([])
  const [pdfHistory, setPdfHistory] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'flagged' | 'non-flagged' | 'pdf-available'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNote, setSelectedNote] = useState<SOAPNote | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })
    return () => unsubscribe()
  }, [])

  const fetchSOAPNotes = useCallback(async () => {
    if (!user) return
    try {
      const token = await user.getIdToken(true)
      const res = await fetch("/api/soap-history", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const notesData = await res.json()
      setSoapNotes(notesData.map((note: any) => ({ id: note.id, ...note })))
    } catch (err) {
      console.error('Error fetching SOAP notes:', err)
    }
  }, [user])

  useEffect(() => { fetchSOAPNotes() }, [fetchSOAPNotes])

  // Real-time PDF history
  useEffect(() => {
    if (!user || !db) return
    const q = query(
      collection(db, 'soapHistory'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPdfHistory(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }, (error) => {
      console.error('Firestore listener error:', error)
    })
    return () => unsubscribe()
  }, [user])

  const isRedFlag = (redFlag: string | boolean): boolean => {
    return typeof redFlag === 'boolean' ? redFlag : redFlag === 'true'
  }

  const handleDelete = async (noteId: string) => {
    if (!user) return
    setDeletingId(noteId)
    try {
      const token = await user.getIdToken(true)
      const res = await fetch(`/api/soap-history/${noteId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setSoapNotes(prev => prev.filter(n => n.id !== noteId))
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  // Client-side filtering: status filter + patient name search
  const filteredNotes = soapNotes.filter(note => {
    // Status filter
    if (filter === 'flagged' && !isRedFlag(note.redFlag)) return false
    if (filter === 'non-flagged' && isRedFlag(note.redFlag)) return false
    if (filter === 'pdf-available' && !((note as any).storagePath || (note as any).pdf?.status === 'generated')) return false
    // Search filter
    if (searchTerm.trim().length >= 2) {
      const term = searchTerm.toLowerCase()
      const nameMatch = (note.patientName || '').toLowerCase().includes(term)
      const pidMatch = (note.patientId || '').toLowerCase().includes(term)
      const assessmentMatch = (note.assessment || '').toLowerCase().includes(term)
      if (!nameMatch && !pidMatch && !assessmentMatch) return false
    }
    return true
  })

  const soapSections = [
    { key: 'subjective', label: 'Subjective', letter: 'S', color: 'blue' },
    { key: 'objective', label: 'Objective', letter: 'O', color: 'emerald' },
    { key: 'assessment', label: 'Assessment', letter: 'A', color: 'amber' },
    { key: 'plan', label: 'Plan', letter: 'P', color: 'indigo' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">SOAP History</h1>
                  <p className="text-white/70 text-sm">View and manage your clinical documentation</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <EhrStatusBadge />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {soapNotes.length} Notes
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter & Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-2xl" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: 'all', label: 'All', icon: FileText },
                  { key: 'flagged', label: 'Flagged', icon: AlertTriangle },
                  { key: 'non-flagged', label: 'Standard', icon: Sparkles },
                  { key: 'pdf-available', label: 'PDF Ready', icon: Download },
                ].map((btn) => (
                  <Button
                    key={btn.key}
                    variant={filter === btn.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(btn.key as any)}
                    className={`text-xs h-8 rounded-lg ${
                      filter === btn.key
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 border-gray-200'
                    }`}
                  >
                    <btn.icon className="h-3 w-3 mr-1" />
                    {btn.label}
                  </Button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative flex-1 w-full sm:w-auto sm:ml-auto sm:max-w-[260px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by patient, ID, or assessment..."
                  className="pl-8 h-8 text-xs border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* PDF History — compact collapsible */}
        {pdfHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-900">Recent PDFs</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                    {pdfHistory.length}
                  </Badge>
                </div>
                <span className="text-xs text-gray-400 group-open:hidden">Click to expand</span>
              </summary>
              <div className="space-y-2 mt-2">
                {pdfHistory.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white border border-gray-200/80 rounded-xl p-3 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.patientName || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {entry.createdAt?.toDate?.()?.toLocaleString?.() || 'Just now'}
                        </p>
                      </div>
                    </div>
                    <a
                      href={entry.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  </div>
                ))}
              </div>
            </details>
          </motion.div>
        )}

        {/* SOAP Notes List */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No SOAP Notes Found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {searchTerm ? `No results for "${searchTerm}"` : 'No notes match the current filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                    className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden relative group"
                  >
                    {/* Accent stripe */}
                    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
                      isRedFlag(note.redFlag)
                        ? 'bg-gradient-to-r from-red-400 to-red-600'
                        : 'bg-gradient-to-r from-indigo-400 to-blue-500'
                    }`} />

                    <div className="p-4">
                      {/* Top row: patient info + actions */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isRedFlag(note.redFlag)
                              ? 'bg-red-100 text-red-600'
                              : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {note.patientName || 'Unknown Patient'}
                              </h3>
                              <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${
                                isRedFlag(note.redFlag)
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}>
                                {isRedFlag(note.redFlag) ? 'Flagged' : 'Standard'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatRelativeTime(note.createdAt)}
                              </span>
                              {note.patientId && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {note.patientId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <ExportToEHRInline note={note} />

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedNote(note)}
                                className="h-7 text-[10px] px-2 rounded-lg border-gray-200"
                              >
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-lg font-semibold text-gray-900">
                                  SOAP Note — {selectedNote?.patientName || 'Unknown'}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedNote && (
                                <div className="space-y-4 mt-2">
                                  {/* Audit row */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-xl p-3">
                                      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Created</p>
                                      <p className="text-sm text-gray-900">{formatDate(selectedNote.createdAt)}</p>
                                      <p className="text-xs text-gray-500">{formatRelativeTime(selectedNote.createdAt)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Clinical</p>
                                      <div className="flex items-center gap-2 text-sm">
                                        {selectedNote.painLevel && <span>Pain: {selectedNote.painLevel}</span>}
                                        <Badge className={`text-[10px] ${isRedFlag(selectedNote.redFlag) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                          {isRedFlag(selectedNote.redFlag) ? 'Red Flag' : 'No Flag'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* SOAP sections */}
                                  <div className="space-y-3">
                                    {soapSections.map((section) => (
                                      <div key={section.key} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <div className={`flex items-center gap-2 px-3 py-2 bg-${section.color}-50 border-b border-${section.color}-100`}>
                                          <span className={`w-5 h-5 bg-${section.color}-200 text-${section.color}-800 rounded flex items-center justify-center text-[10px] font-bold`}>
                                            {section.letter}
                                          </span>
                                          <span className="text-sm font-semibold text-gray-900">{section.label}</span>
                                        </div>
                                        <div className="p-3">
                                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {(selectedNote as any)[section.key]}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Actions footer */}
                                  <div className="pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                                    <ExportToEHR
                                      note={{
                                        id: selectedNote.id,
                                        subjective: selectedNote.subjective,
                                        objective: selectedNote.objective,
                                        assessment: selectedNote.assessment,
                                        plan: selectedNote.plan,
                                        createdAt: selectedNote.createdAt,
                                        patientName: selectedNote.patientName,
                                      }}
                                      patient={selectedNote.patientId || selectedNote.patientName ? {
                                        id: selectedNote.patientId,
                                        name: selectedNote.patientName,
                                      } : undefined}
                                      author={undefined}
                                      attachment={undefined}
                                    />
                                    {((selectedNote as any).pdfUrl || (selectedNote as any).pdf?.url) && (
                                      <a
                                        href={(selectedNote as any).pdfUrl || (selectedNote as any).pdf?.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs">
                                          <ExternalLink className="h-3 w-3 mr-1" /> View PDF
                                        </Button>
                                      </a>
                                    )}
                                    {(selectedNote as any).storagePath && (
                                      <DownloadPdfButton pdfPath={(selectedNote as any).storagePath} />
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Delete button */}
                          {confirmDeleteId === note.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(note.id)}
                                disabled={deletingId === note.id}
                                className="h-7 text-[10px] px-2 rounded-lg"
                              >
                                {deletingId === note.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDeleteId(null)}
                                className="h-7 text-[10px] px-2 rounded-lg border-gray-200"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(note.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                              title="Delete note"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Assessment preview */}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2.5 pl-12">
                        {note.assessment || 'No assessment available'}
                      </p>

                      {/* Status badges */}
                      <div className="flex items-center gap-2 pl-12">
                        {(note as any).pdfUrl || (note as any).pdf?.url ? (
                          <a href={(note as any).pdfUrl || (note as any).pdf?.url} target="_blank" rel="noopener noreferrer">
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] cursor-pointer hover:bg-emerald-100">
                              View PDF
                            </Badge>
                          </a>
                        ) : (note as any).storagePath || (note as any).pdf?.status === 'generated' ? (
                          <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-[10px]">PDF Ready</Badge>
                        ) : null}
                        {note.fhirExport?.status && note.fhirExport.status !== 'none' && (
                          <Badge className={`text-[10px] ${
                            note.fhirExport.status === 'exported'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            EHR: {note.fhirExport.status}
                          </Badge>
                        )}
                        {note.aiSuggested && (
                          <span className="flex items-center gap-1 text-[10px] text-purple-600">
                            <Sparkles className="h-3 w-3" /> AI
                          </span>
                        )}
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
