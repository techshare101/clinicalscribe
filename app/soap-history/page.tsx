'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
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

interface SOAPNote {
  id: string
  userId: string
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
  const [filter, setFilter] = useState<'all' | 'flagged' | 'non-flagged'>('all')
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

    const base = collection(db, 'soapNotes')
    const q = filterPatientId
      ? query(base, where('patientId', '==', filterPatientId), orderBy('createdAt', 'desc'))
      : query(base, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notes: SOAPNote[] = []
      querySnapshot.forEach((doc) => {
        notes.push({ id: doc.id, ...doc.data() } as SOAPNote)
      })
      setSoapNotes(notes)
    })

    return () => unsubscribe()
  }, [user, filterPatientId])

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
        const patientsSnap = await import('firebase/firestore').then(async ({ collection, getDocs, orderBy, startAt, endAt, limit }) => {
          const ref = collection(db, 'patients')
          const q = (await import('firebase/firestore')).query(
            ref,
            orderBy('name_lower'),
            startAt(s),
            endAt(s + '\uf8ff'),
            limit(10)
          )
          return getDocs(q)
        })
        if (cancelled) return
        const opts: { id: string; name: string }[] = []
        patientsSnap.forEach((d: any) => {
          const data = d.data()
          opts.push({ id: d.id, name: data.name || '' })
        })
        setPatientOptions(opts)
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
    return true
  })

  const formatDate = (date: any) => {
    if (!date) return 'Unknown'
    return new Date(date.seconds * 1000).toLocaleDateString()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SOAP History</h1>
          <p className="text-gray-600">View and manage your clinical documentation history</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>SOAP Notes</CardTitle>
            <div className="flex items-center gap-3">
              <EhrStatusBadge />
            </div>
            <div className="flex items-center gap-3 relative">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All Notes
              </Button>
              <Button
                variant={filter === 'flagged' ? 'default' : 'outline'}
                onClick={() => setFilter('flagged')}
              >
                Flagged Only
              </Button>
              <Button
                variant={filter === 'non-flagged' ? 'default' : 'outline'}
                onClick={() => setFilter('non-flagged')}
              >
                Non-Flagged Only
              </Button>

              <div className="relative">
                <input
                  className="border rounded px-2 py-1 text-sm w-56"
                  placeholder="Filter by patient…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                {patientOptions.length > 0 && patientSearch.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-10 max-h-64 overflow-auto">
                    {patientOptions.map((p) => (
                      <button
                        key={p.id}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => {
                          setFilterPatientId(p.id)
                          setPatientSearch(p.name)
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {filterPatientId && (
                <Button variant="outline" size="sm" onClick={() => { setFilterPatientId(null); setPatientSearch('') }}>Clear</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead className="text-right">Pain Level</TableHead>
                <TableHead className="text-right">Export</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>{formatDate(note.createdAt)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{note.patientName || 'Unknown'}</div>
                    {note.patientId && <div className="text-sm text-gray-500">PID: {note.patientId}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md truncate">{note.assessment}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={note.painLevel ? 'default' : 'secondary'}>
                      {note.painLevel || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={note.fhirExport?.status === 'exported' ? 'default' : note.fhirExport?.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {note.fhirExport?.status || 'none'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedNote(note)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>SOAP Note Details</DialogTitle>
                        </DialogHeader>
                        {selectedNote && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-medium mb-2">Audit Information</h3>
                                <div className="text-sm space-y-1">
                                  <div><span className="font-medium">Created:</span> {formatDate(selectedNote.createdAt)}</div>
                                  <div><span className="font-medium">User ID:</span> {selectedNote.userId}</div>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-medium mb-2">Clinical Information</h3>
                                <div className="text-sm space-y-1">
                                  <div><span className="font-medium">Pain Level:</span> {selectedNote.painLevel || 'Not recorded'}</div>
                                  <div><span className="font-medium">AI Suggested:</span> {selectedNote.aiSuggested ? 'Yes' : 'No'}</div>
                                  <div>
                                    <span className="font-medium">Red Flag:</span>
                                    <Badge variant={isRedFlag(selectedNote.redFlag) ? 'destructive' : 'secondary'} className="ml-2">
                                      {isRedFlag(selectedNote.redFlag) ? 'Yes' : 'No'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h3 className="font-medium mb-2">Subjective</h3>
                                <div className="p-3 bg-gray-50 rounded-md">
                                  {selectedNote.subjective}
                                </div>
                              </div>

                              <div>
                                <h3 className="font-medium mb-2">Objective</h3>
                                <div className="p-3 bg-gray-50 rounded-md">
                                  {selectedNote.objective}
                                </div>
                              </div>

                              <div>
                                <h3 className="font-medium mb-2">Assessment</h3>
                                <div className="p-3 bg-gray-50 rounded-md">
                                  {selectedNote.assessment}
                                </div>
                              </div>

                              <div>
                                <h3 className="font-medium mb-2">Plan</h3>
                                <div className="p-3 bg-gray-50 rounded-md">
                                  {selectedNote.plan}
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t">
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
                              {/* If a storage path exists for this note, show a download button */}
                              {(selectedNote as any).storagePath && (
                                <div className="mt-3">
                                  <DownloadPdfButton pdfPath={(selectedNote as any).storagePath} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No SOAP notes found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}