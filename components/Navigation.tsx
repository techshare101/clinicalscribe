'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Mic, Home, Settings, User, Stethoscope, History, FileCode2 } from 'lucide-react'
import { useSmartStatus } from '@/hooks/use-smart-status'

function SmartIndicator() {
  const { connected, fhirBase } = useSmartStatus()
  const defaultFhirBase = 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'

  return (
    <div className="hidden sm:flex items-center gap-2 text-xs mr-2">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="truncate max-w-[10rem]" title={fhirBase ?? undefined}>
        {connected ? 'EHR Connected' : 'EHR Disconnected'}
      </span>
      {connected ? (
        <form action="/api/smart/disconnect" method="post">
          <button className="underline ml-1" type="submit">Disconnect</button>
        </form>
      ) : (
        <a
          href={`/smart/launch?fhirBase=${encodeURIComponent(defaultFhirBase)}`}
          className="underline ml-1"
          title="Connect to EHR"
        >
          Connect
        </a>
      )}
    </div>
  )
}

export function Navigation() {
  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-6 w-6" />
          <span>ClinicalScribe</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <SmartIndicator />

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
          <Link href="/ehr-sandbox">
            <Button variant="ghost" size="sm">
              <FileCode2 className="h-4 w-4 mr-2" />
              EHR Sandbox
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