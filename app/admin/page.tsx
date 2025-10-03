'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { Loader2 } from 'lucide-react'

export default function AdminHome() {
  const router = useRouter()
  const { role, loading } = useUserRole()

  useEffect(() => {
    if (!loading) {
      // Redirect based on role
      if (role === 'system-admin') {
        router.push('/admin/demo')
      } else if (role === 'nurse-admin') {
        router.push('/admin/console')
      } else {
        // Non-admin users shouldn't be here
        router.push('/dashboard')
      }
    }
  }, [role, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting to admin panel...</p>
        </div>
      </div>
    )
  }

  return null
}