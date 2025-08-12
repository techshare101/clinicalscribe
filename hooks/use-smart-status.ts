import { useEffect, useState } from 'react'

export function useSmartStatus() {
  const [status, setStatus] = useState<{ connected: boolean; fhirBase?: string | null }>({ connected: false, fhirBase: null })

  async function fetchStatus() {
    try {
      const res = await fetch('/api/smart/status', { cache: 'no-store' })
      const json = await res.json()
      setStatus(json)
    } catch (_) {
      setStatus({ connected: false, fhirBase: null })
    }
  }

  useEffect(() => {
    fetchStatus()
    const onVis = () => document.visibilityState === 'visible' && fetchStatus()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return status
}
