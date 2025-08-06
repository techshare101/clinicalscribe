'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Mic, 
  Home, 
  Settings, 
  User, 
  Stethoscope,
  History
} from 'lucide-react'

export function Navigation() {
  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-6 w-6" />
          <span>ClinicalScribe</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/transcription">
            <Button variant="ghost" size="sm">
              <Mic className="h-4 w-4 mr-2" />
              Transcription
            </Button>
          </Link>
          <Link href="/soap">
            <Button variant="ghost" size="sm">
              <Stethoscope className="h-4 w-4 mr-2" />
              SOAP Generator
            </Button>
          </Link>
          <Link href="/soap-entry">
            <Button variant="ghost" size="sm">
              <Stethoscope className="h-4 w-4 mr-2" />
              SOAP Entry
            </Button>
          </Link>
          <Link href="/soap-history">
            <Button variant="ghost" size="sm">
              <History className="h-4 w-4 mr-2" />
              SOAP History
            </Button>
          </Link>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}