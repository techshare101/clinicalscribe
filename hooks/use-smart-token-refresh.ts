import { useEffect, useCallback, useRef } from 'react'
import { useSmartStatus } from './use-smart-status'

interface UseSmartTokenRefreshOptions {
  // Refresh when token expires in this many seconds (default: 300 = 5 minutes)
  refreshBufferSeconds?: number
  // Enable automatic refresh (default: true)
  autoRefresh?: boolean
  onRefreshSuccess?: () => void
  onRefreshError?: (error: Error) => void
}

export function useSmartTokenRefresh(options: UseSmartTokenRefreshOptions = {}) {
  const {
    refreshBufferSeconds = 300, // 5 minutes before expiry
    autoRefresh = true,
    onRefreshSuccess,
    onRefreshError
  } = options

  const { refreshToken } = useSmartStatus()
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()
  const isRefreshingRef = useRef(false)

  const performTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log('🔄 Token refresh already in progress, skipping...')
      return
    }

    try {
      isRefreshingRef.current = true
      console.log('🔄 Performing token refresh...')

      const res = await fetch('/api/smart/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Token refresh failed')
      }

      console.log('✅ Token refreshed successfully, expires in:', data.expiresIn)
      
      // Schedule next refresh
      if (autoRefresh && data.expiresIn) {
        const nextRefreshIn = Math.max(
          (data.expiresIn - refreshBufferSeconds) * 1000,
          60000 // At least 1 minute
        )
        
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = setTimeout(performTokenRefresh, nextRefreshIn)
        
        console.log(`⏰ Next refresh scheduled in ${Math.round(nextRefreshIn / 1000)}s`)
      }

      onRefreshSuccess?.()
      
      // Trigger a re-fetch of smart status
      await refreshToken()

    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      isRefreshingRef.current = false
      onRefreshError?.(error as Error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [autoRefresh, refreshBufferSeconds, refreshToken, onRefreshSuccess, onRefreshError])

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    clearTimeout(refreshTimeoutRef.current)
    return performTokenRefresh()
  }, [performTokenRefresh])

  // Set up automatic refresh on mount if enabled
  useEffect(() => {
    if (!autoRefresh) return

    // Check token expiry on mount and schedule refresh if needed
    const checkInitialExpiry = async () => {
      try {
        const res = await fetch('/api/smart/status', {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          }
        })
        
        if (!res.ok) return

        const data = await res.json()
        
        // If we have an expiry time, schedule refresh
        if (data.connected && data.expiresIn) {
          const refreshIn = Math.max(
            (data.expiresIn - refreshBufferSeconds) * 1000,
            60000 // At least 1 minute
          )
          
          clearTimeout(refreshTimeoutRef.current)
          refreshTimeoutRef.current = setTimeout(performTokenRefresh, refreshIn)
          
          console.log(`⏰ Initial refresh scheduled in ${Math.round(refreshIn / 1000)}s`)
        }
      } catch (err) {
        console.error('Failed to check initial token expiry:', err)
      }
    }

    checkInitialExpiry()

    // Cleanup on unmount
    return () => {
      clearTimeout(refreshTimeoutRef.current)
    }
  }, [autoRefresh, refreshBufferSeconds, performTokenRefresh])

  // Also refresh when tab becomes visible
  useEffect(() => {
    if (!autoRefresh) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isRefreshingRef.current) {
        console.log('👁️ Tab became visible, checking if refresh needed...')
        // Perform a manual check/refresh
        performTokenRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [autoRefresh, performTokenRefresh])

  return {
    refreshToken: manualRefresh,
    isRefreshing: isRefreshingRef.current
  }
}