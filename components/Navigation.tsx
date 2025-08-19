"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useEffect } from 'react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/ehr-sandbox', label: 'EHR Sandbox' },
  { href: '/soap', label: 'SOAP' },
  { href: '/transcription', label: 'Transcription' },
]

export function Navigation() {
  const pathname = usePathname()
  const profile = useProfile()

  // Keep a lightweight cookie in sync for middleware checks
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (profile?.role === 'admin') {
      document.cookie = `role=admin; Path=/; Max-Age=${60 * 60 * 24 * 7}` // 7 days
    } else {
      // Overwrite to clear for non-admin
      document.cookie = 'role=; Path=/; Max-Age=0'
    }
  }, [profile?.role])
  return (
    <header className="w-full border-b bg-white">
      <nav className="container mx-auto flex items-center gap-4 px-4 py-3 overflow-x-auto">
        <div className="font-semibold mr-4 flex items-center gap-3">
          <span>ClinicalScribe</span>
          {profile?.role === 'admin' && (
            <>
              <Link
                href="/admin"
                className="text-sm font-semibold text-purple-700 hover:underline"
              >
                Admin Panel
              </Link>
              <span
                title="You are signed in as an Admin. Elevated privileges enabled."
                className="px-2 py-0.5 text-xs font-semibold text-white bg-purple-600 rounded-full shadow-sm"
              >
                Admin Mode
              </span>
            </>
          )}
        </div>
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
