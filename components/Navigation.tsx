"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/ehr-sandbox', label: 'EHR Sandbox' },
  { href: '/soap', label: 'SOAP' },
  { href: '/transcription', label: 'Transcription' },
]

export function Navigation() {
  const pathname = usePathname()
  return (
    <header className="w-full border-b bg-white">
      <nav className="container mx-auto flex items-center gap-4 px-4 py-3 overflow-x-auto">
        <div className="font-semibold mr-4">ClinicalScribe</div>
        {links.map((l) => {
          const active = pathname === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={
                'text-sm px-2 py-1 rounded ' +
                (active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100')
              }
            >
              {l.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
