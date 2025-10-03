"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { ChevronDownIcon, UserIcon, CogIcon, LogOutIcon, Sparkles, Lock } from 'lucide-react'

// Define all navigation items
const allNavItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/soap', label: 'SOAP' },
  { href: '/soap-history', label: 'SOAP History' },
  { href: '/soap-entry', label: 'Manual SOAP' },
  { href: '/transcription', label: 'Transcription' },
  { href: '/ehr-sandbox', label: 'EHR Sandbox' },
]

// Define items visible to non-subscribed users
const publicNavItems = [
  { href: '/plans', label: 'Plans' },
  { href: '/pricing', label: 'Pricing' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, isLoading } = useProfile()
  const { logout } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  // Debug logging
  useEffect(() => {
    if (!isLoading && profile) {
      console.log('Navigation - Profile loaded:', { 
        role: profile.role,
        email: profile.email,
        betaActive: profile.betaActive 
      })
    }
  }, [profile, isLoading])

  // Prevent hydration mismatch by only showing dynamic content after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Keep a lightweight cookie in sync for middleware checks
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (profile?.role === 'system-admin' || profile?.role === 'nurse-admin') {
      document.cookie = `role=${profile.role}; Path=/; Max-Age=${60 * 60 * 24 * 7}` // 7 days
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
      setShowProfileMenu(false)
      await logout() // This will handle redirect to home page
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleTabClick = (e: React.MouseEvent, href: string) => {
    // Admin users have access to all tabs
    if (profile?.role === 'system-admin' || profile?.role === 'nurse-admin') {
      return; // Allow navigation
    }
    
    // Users with beta access have access to all tabs
    if (profile?.betaActive) {
      return; // Allow navigation
    }
    
    // Non-subscribed users can only access pricing and plans
    const isLocked = href !== '/pricing' && href !== '/plans'
    if (isLocked) {
      e.preventDefault()
      router.push('/pricing?ref=nav')
    }
  }

  // Determine which nav items to show based on subscription status and role
  const getVisibleNavItems = () => {
    // Admin users see all items
    if (profile?.role === 'system-admin' || profile?.role === 'nurse-admin') {
      return [...allNavItems, ...publicNavItems]
    }
    
    // Users with beta access see all items
    if (profile?.betaActive) {
      return [...allNavItems, ...publicNavItems]
    }
    
    // Non-subscribed users only see public items
    return publicNavItems
  }

  const visibleNavItems = getVisibleNavItems()

  return (
    <header className="w-full border-b bg-white">
      <nav className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo and Admin Panel */}
        <div className="font-semibold flex items-center gap-3">
          <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
            ClinicalScribe
          </Link>
          {isHydrated && !isLoading && profile?.role && (
            <>
              {profile.role === 'nurse-admin' && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    Training Tools
                  </Link>
                  <span
                    title="You are signed in as a Nurse Admin. Training tools enabled."
                    className="px-2 py-0.5 text-xs font-semibold text-white bg-indigo-600 rounded-full shadow-sm"
                  >
                    Nurse Admin
                  </span>
                </>
              )}
              {profile.role === 'system-admin' && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="text-sm font-semibold text-purple-700 hover:underline"
                  >
                    Admin Panel
                  </Link>
                  <span
                    title="You are signed in as a System Admin. Full privileges enabled."
                    className="px-2 py-0.5 text-xs font-semibold text-white bg-purple-600 rounded-full shadow-sm"
                  >
                    System Admin
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Navigation Links - Now positioned closer to the logo */}
        <div className="flex items-center gap-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href
            // Admin users and beta users have access to all tabs
            const isLocked = profile?.role !== 'system-admin' && profile?.role !== 'nurse-admin' && !profile?.betaActive && item.href !== '/pricing' && item.href !== '/plans'
            
            return (
              <div 
                key={item.href} 
                className="relative"
                onMouseEnter={() => setHoveredTab(item.href)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <Link
                  href={item.href}
                  onClick={(e) => handleTabClick(e, item.href)}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 backdrop-blur-sm ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                      : isLocked 
                        ? 'text-gray-500 hover:text-gray-600 bg-gray-100/50 hover:bg-gray-100/70 border border-gray-200/50 opacity-75 cursor-pointer'
                        : 'text-gray-700 hover:text-indigo-600 bg-white/70 hover:bg-white/90 border border-white/50 hover:border-indigo-200 shadow-sm hover:shadow-md transform hover:scale-105'
                  }`}
                >
                  <span>{item.label}</span>
                  {isLocked && (
                    <Lock className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  
                  {/* Gradient border effect for active tab */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 rounded-xl transition-opacity duration-300" />
                  )}
                </Link>
                
                {/* Tooltip for locked tabs */}
                {isLocked && hoveredTab === item.href && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
                    <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      🔒 Upgrade to unlock
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
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
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-xl border border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="group px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
                    Join Beta
                  </span>
                </Link>
              </div>
            )
          ) : (
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          )}
        </div>
      </nav>
    </header>
  )
}