"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ChevronDownIcon, UserIcon, CogIcon, LogOutIcon } from 'lucide-react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/soap', label: 'SOAP' },
  { href: '/soap-history', label: 'SOAP History' },
  { href: '/soap-entry', label: 'Manual SOAP' },
  { href: '/transcription', label: 'Transcription' },
  { href: '/ehr-sandbox', label: 'EHR Sandbox' },
  { href: '/plans', label: 'Plans' },
  { href: '/pricing', label: 'Pricing' },
]

export default function Navigation() {
  const pathname = usePathname()
  const { profile, isLoading } = useProfile()
  const [isHydrated, setIsHydrated] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Prevent hydration mismatch by only showing dynamic content after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowProfileMenu(false)
    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showProfileMenu])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setShowProfileMenu(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  return (
    <header className="w-full border-b bg-white">
      <nav className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo and Admin Panel */}
        <div className="font-semibold flex items-center gap-3">
          <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
            ClinicalScribe
          </Link>
          {isHydrated && !isLoading && profile?.role === 'admin' && (
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

        {/* Navigation Links */}
        <div className="flex items-center gap-6 overflow-x-auto">
          {links.slice(1).map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  'text-sm px-3 py-2 rounded-md transition-colors ' +
                  (active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  )
                }
              >
                {l.label}
              </Link>
            )
          })}
        </div>

        {/* Profile Menu or Login */}
        <div className="flex items-center">
          {isHydrated && !isLoading ? (
            profile ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowProfileMenu(!showProfileMenu)
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{profile.displayName || profile.email || 'User'}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <CogIcon className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            )
          ) : (
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          )}
        </div>
      </nav>
    </header>
  )
}
