'use client'

import { useEffect, useState } from 'react'

export default function FirebaseDiagnostics() {
  const [status, setStatus] = useState<'idle' | 'running' | 'ok' | 'fail'>(
    'idle'
  )
  const [message, setMessage] = useState('')

  async function runTest() {
    setStatus('running')
    setMessage('')
    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      if (!apiKey) throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY')
      // Intentionally send an invalid token to test reachability to Identity Toolkit
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(
        apiKey
      )}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'bogus', returnSecureToken: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('ok')
        setMessage('Unexpected OK from Identity Toolkit.')
      } else {
        // INVALID_CUSTOM_TOKEN means network is OK, config likely OK
        setStatus('ok')
        setMessage(`Reachable. Error as expected: ${data?.error?.message || res.status}`)
      }
    } catch (e: any) {
      setStatus('fail')
      setMessage(
        `Network failed: ${e?.message || e}.\nTroubleshooting:\n` +
          [
            '• Disable ad blockers / tracking protection (they often block identitytoolkit.googleapis.com).',
            '• Check internet connection and retry.',
            '• Ensure localhost is in Firebase Auth > Settings > Authorized domains.',
            '• Verify NEXT_PUBLIC_FIREBASE_* in .env.local and restart dev server.',
          ].join('\n')
      )
    }
  }

  useEffect(() => {
    // Auto-run once to provide immediate feedback
    runTest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Firebase Diagnostics</h1>
      <p>Checks connectivity to Google Identity Toolkit (Firebase Auth REST API).</p>
      <button
        onClick={runTest}
        disabled={status === 'running'}
        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}
      >
        {status === 'running' ? 'Running...' : 'Run Test'}
      </button>
      <pre
        style={{
          marginTop: 12,
          whiteSpace: 'pre-wrap',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          padding: 10,
        }}
      >
        {message || 'No output yet.'}
      </pre>
    </div>
  )
}
