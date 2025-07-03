'use client'

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  User, 
  FileText, 
  Eye, 
  Download,
  ChevronRight 
} from "lucide-react"

interface Transcription {
  id: string
  patientName: string
  timestamp: string
  status: 'awaiting' | 'soap-ready' | 'signed'
  duration: string
  summary: string
  soapNote?: string
  recordedBy: string
}

// Mock data - replace with real data from your backend
const mockTranscriptions: Transcription[] = [
  {
    id: '1',
    patientName: 'John Smith',
    timestamp: '2024-01-15 14:30',
    status: 'soap-ready',
    duration: '5:23',
    summary: 'Patient reports chest pain, shortness of breath. Vital signs stable. Recommended EKG and blood work.',
    soapNote: 'S: Patient reports acute chest pain...',
    recordedBy: 'Dr. Johnson'
  },
  {
    id: '2',
    patientName: 'Maria Garcia',
    timestamp: '2024-01-15 14:15',
    status: 'signed',
    duration: '3:45',
    summary: 'Follow-up visit for hypertension. Blood pressure controlled with current medication.',
    soapNote: 'S: Patient reports feeling well...',
    recordedBy: 'Dr. Smith'
  },
  {
    id: '3',
    patientName: 'Robert Johnson',
    timestamp: '2024-01-15 13:45',
    status: 'awaiting',
    duration: '7:12',
    summary: 'Initial consultation for diabetes management. Patient education provided.',
    recordedBy: 'Dr. Wilson'
  },
  {
    id: '4',
    patientName: 'Sarah Davis',
    timestamp: '2024-01-15 13:20',
    status: 'soap-ready',
    duration: '4:30',
    summary: 'Routine physical examination. All systems normal.',
    soapNote: 'S: Patient here for annual physical...',
    recordedBy: 'Dr. Brown'
  },
  {
    id: '5',
    patientName: 'Michael Wilson',
    timestamp: '2024-01-15 12:55',
    status: 'signed',
    duration: '6:15',
    summary: 'Post-operative follow-up. Wound healing well, no complications.',
    soapNote: 'S: Patient reports minimal pain...',
    recordedBy: 'Dr. Taylor'
  }
]

interface SummaryListProps {
  limit?: number
}

export function SummaryList({ limit = 5 }: SummaryListProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'soap'>('summary')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusColor = (status: Transcription['status']) => {
    switch (status) {
      case 'awaiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'soap-ready':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'signed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: Transcription['status']) => {
    switch (status) {
      case 'awaiting':
        return 'Awaiting Summary'
      case 'soap-ready':
        return 'SOAP Ready'
      case 'signed':
        return 'Signed'
      default:
        return 'Unknown'
    }
  }

  const displayedTranscriptions = mockTranscriptions.slice(0, limit)

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('summary')}
          >
            View Summary
          </Button>
          <Button
            variant={viewMode === 'soap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('soap')}
          >
            View SOAP
          </Button>
        </div>
        <Badge variant="secondary" className="text-xs">
          {displayedTranscriptions.length} Recent
        </Badge>
      </div>

      {/* Transcription List */}
      <div className="space-y-3">
        {displayedTranscriptions.map((transcription, index) => (
          <Card 
            key={transcription.id} 
            className="transition-all hover:shadow-md cursor-pointer"
            onClick={() => setExpandedId(
              expandedId === transcription.id ? null : transcription.id
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">
                        {transcription.patientName}
                      </h3>
                      <Badge 
                        className={getStatusColor(transcription.status)}
                        variant="outline"
                      >
                        {getStatusText(transcription.status)}
                      </Badge>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        expandedId === transcription.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{transcription.timestamp}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{transcription.recordedBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{transcription.duration}</span>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="text-sm text-gray-700">
                    {viewMode === 'summary' ? (
                      <p className="line-clamp-2">{transcription.summary}</p>
                    ) : (
                      <p className="line-clamp-2">
                        {transcription.soapNote || 'SOAP note not available'}
                      </p>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {expandedId === transcription.id && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 mb-2">
                            {viewMode === 'summary' ? 'Full Summary:' : 'SOAP Note:'}
                          </h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {viewMode === 'summary' 
                              ? transcription.summary 
                              : (transcription.soapNote || 'SOAP note not available')
                            }
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 pt-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View Full
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {mockTranscriptions.length > limit && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            Load More Transcriptions
          </Button>
        </div>
      )}
    </div>
  )
}