'use client'

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  Calendar, 
  Activity, 
  Filter,
  Download,
  Eye
} from "lucide-react"

interface AuditLogEntry {
  id: string
  timestamp: string
  user: string
  action: string
  patientName: string
  details: string
  type: 'record' | 'review' | 'approve' | 'export' | 'edit'
}

// Mock audit data
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:35:22',
    user: 'Dr. Johnson',
    action: 'Recorded Transcription',
    patientName: 'John Smith',
    details: 'New patient consultation recorded (5:23 duration)',
    type: 'record'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:32:15',
    user: 'Nurse Williams',
    action: 'Approved SOAP Note',
    patientName: 'Maria Garcia',
    details: 'SOAP note reviewed and approved for signature',
    type: 'approve'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:28:45',
    user: 'Dr. Smith',
    action: 'Exported to PDF',
    patientName: 'Robert Johnson',
    details: 'Patient summary exported for external referral',
    type: 'export'
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:25:10',
    user: 'Admin Davis',
    action: 'Flagged for Review',
    patientName: 'Sarah Davis',
    details: 'Transcription flagged for quality assurance review',
    type: 'review'
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:20:33',
    user: 'Dr. Brown',
    action: 'Edited Transcription',
    patientName: 'Michael Wilson',
    details: 'Minor corrections made to transcription accuracy',
    type: 'edit'
  },
  {
    id: '6',
    timestamp: '2024-01-15 14:15:18',
    user: 'Dr. Taylor',
    action: 'Recorded Transcription',
    patientName: 'Jennifer Lee',
    details: 'Follow-up appointment recorded (3:45 duration)',
    type: 'record'
  },
  {
    id: '7',
    timestamp: '2024-01-15 14:10:55',
    user: 'Nurse Martinez',
    action: 'Approved SOAP Note',
    patientName: 'David Chen',
    details: 'SOAP note reviewed and approved for signature',
    type: 'approve'
  },
  {
    id: '8',
    timestamp: '2024-01-15 14:05:42',
    user: 'Dr. Wilson',
    action: 'Exported to PDF',
    patientName: 'Lisa Anderson',
    details: 'Complete medical summary exported for insurance',
    type: 'export'
  }
]

interface AuditLogProps {
  limit?: number
}

export function AuditLog({ limit = 8 }: AuditLogProps) {
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('today')

  const getActionColor = (type: AuditLogEntry['type']) => {
    switch (type) {
      case 'record':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approve':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'export':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'edit':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionIcon = (type: AuditLogEntry['type']) => {
    switch (type) {
      case 'record':
        return <Activity className="h-3 w-3" />
      case 'review':
        return <Eye className="h-3 w-3" />
      case 'approve':
        return <Activity className="h-3 w-3" />
      case 'export':
        return <Download className="h-3 w-3" />
      case 'edit':
        return <Activity className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  // Get unique users and actions for filters
  const uniqueUsers = [...new Set(mockAuditLogs.map(log => log.user))]
  const uniqueActions = [...new Set(mockAuditLogs.map(log => log.action))]

  // Filter logs based on selected filters
  const filteredLogs = mockAuditLogs.filter(log => {
    if (filterUser !== 'all' && log.user !== filterUser) return false
    if (filterAction !== 'all' && log.action !== filterAction) return false
    // Add date filtering logic here if needed
    return true
  }).slice(0, limit)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <Filter className="h-4 w-4 text-gray-600" />
        <div className="flex items-center space-x-2 flex-1">
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUsers.map(user => (
                <SelectItem key={user} value={user}>{user}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Badge variant="secondary" className="text-xs">
          {filteredLogs.length} Entries
        </Badge>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-2">
        {filteredLogs.map((log, index) => (
          <Card key={log.id} className="transition-all hover:shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {/* Time Column */}
                <div className="flex flex-col items-center text-xs text-gray-500 min-w-[60px]">
                  <span className="font-medium">{formatTime(log.timestamp)}</span>
                  <span>{formatDate(log.timestamp)}</span>
                </div>

                {/* Action Badge */}
                <div className="flex-shrink-0">
                  <Badge 
                    className={`${getActionColor(log.type)} flex items-center space-x-1`}
                    variant="outline"
                  >
                    {getActionIcon(log.type)}
                    <span className="text-xs">{log.type.toUpperCase()}</span>
                  </Badge>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{log.user}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-600">{log.action}</span>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Patient:</span> {log.patientName}
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {log.details}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {mockAuditLogs.length > limit && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            Load More Entries
          </Button>
        </div>
      )}
    </div>
  )
}