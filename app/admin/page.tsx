'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, limit, query } from 'firebase/firestore'

type Profile = {
  uid?: string
  email?: string | null
  displayName?: string | null
  role?: string
}

export default function AdminHome() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  async function loadProfiles() {
    setLoading(true)
    setError(null)
    try {
      const ref = collection(db, 'profiles')
      const qy = query(ref, limit(25))
      const snap = await getDocs(qy)
      const rows: Profile[] = []
      snap.forEach((d) => rows.push({ uid: d.id, ...(d.data() as any) }))
      setProfiles(rows)
    } catch (e) {
      setError('Failed to load profiles. Ensure your account has admin role.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUserEmail(u?.email ?? null)
      if (!u) {
        setProfiles([])
        setLoading(false)
        return
      }
      await loadProfiles()
    })
    return () => unsub()
  }, [])

  async function promote(uid?: string) {
    if (!uid) return
    try {
      setBusyUid(uid)
      setMessage(null)
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error('Not signed in')
      const idToken = await currentUser.getIdToken(/* forceRefresh */ true)
      const res = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to promote')
      setMessage('User promoted to admin. They must re-auth to receive claims.')
      await loadProfiles()
    } catch (e: any) {
      setError(e?.message || 'Promotion failed')
    } finally {
      setBusyUid(null)
    }
  }

  async function seedSOAPHistoryDemo() {
    try {
      setSeeding(true)
      setMessage(null)
      setError(null)
      
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error('Not signed in')
      const userId = currentUser.uid
      
      // Call the API route to seed demo data
      const idToken = await currentUser.getIdToken()
      const res = await fetch('/api/seed-soap-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId }),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.error || 'Failed to seed demo data')
      
      setMessage('SOAP History demo data seeded successfully!')
    } catch (e: any) {
      setError(e?.message || 'Failed to seed demo data')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Admin Console</h1>
      <p className="mt-2 text-sm text-gray-600">Welcome{userEmail ? `, ${userEmail}` : ''}.</p>

      {/* Seed Demo Data Button */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800">Demo Data Seeding</h2>
        <p className="mt-1 text-sm text-blue-600">
          Seed demo data for the SOAP History page to see it in action
        </p>
        <button
          onClick={seedSOAPHistoryDemo}
          disabled={seeding}
          className={`mt-3 px-4 py-2 rounded-md text-white font-medium ${
            seeding 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {seeding ? 'Seeding...' : 'Seed SOAP History Demo Data'}
        </button>
      </div>

      {loading && (
        <div className="mt-4 text-sm text-gray-600">Loading profiles…</div>
      )}
      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">{error}</div>
      )}
      {message && (
        <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700">{message}</div>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">UID</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Display Name</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.uid} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{p.uid}</td>
                  <td className="py-2 pr-4">{p.email || '—'}</td>
                  <td className="py-2 pr-4">{p.displayName || '—'}</td>
                  <td className="py-2 pr-4">{p.role || 'user'}</td>
                  <td className="py-2 pr-4">
                    {p.role !== 'admin' ? (
                      <button
                        onClick={() => promote(p.uid)}
                        disabled={busyUid === p.uid}
                        className="px-2 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
                      >
                        {busyUid === p.uid ? 'Promoting…' : 'Promote to Admin'}
                      </button>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}