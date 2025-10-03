'use client'

import { useSmartStatus } from '@/hooks/use-smart-status'
import { useSmartTokenRefresh } from '@/hooks/use-smart-token-refresh'
import { useEffect, useState } from 'react'
import { Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export function SmartConnectionStatus() {
  const status = useSmartStatus()
  const [timeLeft, setTimeLeft] = useState<string>('')
  
  // Enable auto-refresh with 5 minute buffer
  const { refreshToken, isRefreshing } = useSmartTokenRefresh({
    refreshBufferSeconds: 300,
    autoRefresh: true,
    onRefreshSuccess: () => {
      console.log('✅ Token refresh successful!')
    },
    onRefreshError: (error) => {
      console.error('❌ Token refresh failed:', error)
    }
  })

  // Update countdown timer
  useEffect(() => {
    if (!status.connected || !status.expiresIn) return

    const updateTimer = () => {
      const now = Date.now()
      const expiryTime = now + (status.expiresIn * 1000)
      const remaining = Math.max(0, expiryTime - Date.now())
      
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [status.connected, status.expiresIn])

  if (status.loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Checking SMART connection...</span>
      </div>
    )
  }

  if (!status.connected) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="w-4 h-4" />
        <span>Not connected to Epic</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span>Connected to Epic</span>
      </div>
      
      {status.hasRefreshToken && (
        <>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Token expires in: {timeLeft}</span>
          </div>
          
          <button
            onClick={() => refreshToken()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </>
      )}
      
      {status.refreshed && (
        <span className="text-sm text-green-600">
          ✅ Token auto-refreshed
        </span>
      )}
    </div>
  )
}