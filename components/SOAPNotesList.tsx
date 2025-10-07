'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSOAPNotes } from '@/hooks/useSOAPNotes'
import { DownloadPdfButton } from '@/components/DownloadPDFButton'
import { useAuth } from '@/hooks/useAuth'
import { FileText, Download, ExternalLink, Clock, User, Globe, Languages } from 'lucide-react'

// Language flag mapping
const languageFlags: Record<string, string> = {
  auto: "🌐",
  so: "🇸🇴", // Somali
  hmn: "🇱🇦", // Hmong
  sw: "🇰🇪", // Swahili
  ar: "🇸🇦", // Arabic
  en: "🇺🇸", // English
};

// Language color mapping for badges
const languageColors: Record<string, string> = {
  auto: "bg-gray-100 text-gray-800",
  so: "bg-purple-100 text-purple-800",   // Somali - Purple
  hmn: "bg-orange-100 text-orange-800", // Hmong - Orange
  sw: "bg-green-100 text-green-800",    // Swahili - Green
  ar: "bg-red-100 text-red-800",        // Arabic - Red
  en: "bg-blue-100 text-blue-800",      // English - Blue
};

interface SOAPNotesListProps {
  limit?: number
}

export default function SOAPNotesList({ limit = 10 }: SOAPNotesListProps) {
  const { soapNotes, isLoading, error } = useSOAPNotes(limit)
  const { user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-red-800">Error: {error}</div>
          <div className="mt-2 text-sm text-red-600">
            This error occurred while trying to fetch your SOAP notes from the database. 
            Please refresh the page or contact support if the issue persists.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (soapNotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No SOAP Notes</h3>
          <p className="text-gray-500">You haven't created any SOAP notes yet.</p>
        </CardContent>
      </Card>
    )
  }

  // Helper to get PDF path from note
  const getPDFPath = (note: any): string | undefined => {
    // Check for filePath (new format from PDF generation)
    if (note.filePath) return note.filePath;
    // Fallback to storagePath (legacy format)
    if (note.storagePath) return note.storagePath;
    // Try to construct path if we have user and note ID
    if (user && note.id) return `pdfs/${user.uid}/${note.id}.pdf`;
    return undefined;
  };

  // Format date helper function
  const formatDate = (date: any): string => {
    if (!date) return 'Unknown date'
    
    try {
      // Handle Firestore Timestamp
      if (date.toDate) {
        return date.toDate().toLocaleString()
      }
      // Handle regular Date object
      else if (date instanceof Date) {
        return date.toLocaleString()
      }
      // Handle ISO string
      else if (typeof date === 'string') {
        return new Date(date).toLocaleString()
      }
      // Handle timestamp in seconds
      else if (typeof date === 'object' && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleString()
      }
      return 'Unknown date'
    } catch (e) {
      return 'Invalid date'
    }
  }

  // Get language display with flag and badge
  const getLanguageDisplay = (langCode: string | undefined) => {
    if (!langCode) return 'Unknown'
    
    const flag = languageFlags[langCode] || '🌐'
    const displayName = langCode === 'auto' ? 'Auto Detect' : langCode.toUpperCase()
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{flag}</span>
        <Badge className={languageColors[langCode] || "bg-gray-100 text-gray-800"}>
          {displayName}
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {soapNotes.map((note) => (
        <Card key={note.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  {note.patientName || note.soap?.patientName || 'Unknown Patient'}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatDate(note.createdAt || note.soap?.timestamp)}</span>
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {note.encounterType && (
                  <Badge variant="secondary">{note.encounterType}</Badge>
                )}
                {note.soap?.encounterType && (
                  <Badge variant="secondary">{note.soap.encounterType}</Badge>
                )}
                {note.pdf?.status === 'generated' && (
                  <Badge className="bg-green-100 text-green-800">PDF Ready</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile-friendly language information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Patient Language */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Patient Language
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium">
                    {getLanguageDisplay(note.patientLang)}
                  </span>
                </div>
              </div>
              
              {/* Documentation Language */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Documentation
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium">
                    {getLanguageDisplay(note.docLang)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Doctor Information */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Provider Information
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-medium">
                  {note.doctorName || 'Unknown Doctor'}
                </span>
              </div>
            </div>
            
            {/* Action Buttons - Stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              {getPDFPath(note) ? (
                <DownloadPdfButton 
                  pdfPath={getPDFPath(note)!} 
                  className="flex-1 flex items-center justify-center gap-2"
                />
              ) : (
                <div className="flex-1 p-2 text-center text-sm text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                  <FileText className="h-4 w-4 mx-auto mb-1" />
                  No PDF available
                </div>
              )}
            </div>
            
            {/* SOAP Content - Responsive layout */}
            {note.soap && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-1">Subjective</h4>
                    <p className="text-blue-800 text-sm">{note.soap.subjective}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-medium text-green-900 mb-1">Assessment</h4>
                    <p className="text-green-800 text-sm">{note.soap.assessment}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Transcripts - Mobile optimized */}
            {(note.rawTranscript || note.transcript || note.translatedTranscript) && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-gray-900 border-b pb-1">Transcripts</h4>
                <div className="space-y-3">
                  {note.rawTranscript && (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-yellow-800">Raw Transcript</span>
                        {getLanguageDisplay(note.patientLang)}
                      </div>
                      <p className="text-yellow-700 text-sm">{note.rawTranscript}</p>
                    </div>
                  )}
                  
                  {(note.transcript || note.translatedTranscript) && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-800">Translated Transcript</span>
                        {getLanguageDisplay(note.docLang)}
                      </div>
                      <p className="text-blue-700 text-sm">
                        {note.translatedTranscript || note.transcript}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}