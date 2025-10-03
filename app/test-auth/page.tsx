'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'

export default function TestAuthPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<{token: string | null, length: number | null}>({token: null, length: null})

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })

    return () => unsubscribe()
  }, [])

  const getTokenInfo = async () => {
    if (!user) {
      setResult('No user logged in')
      return
    }

    try {
      // Get the current user's ID token
      const token = await user.getIdToken();
      console.log('Token:', token);
      console.log('Token length:', token?.length || 0);
      setTokenInfo({token: token?.substring(0, 50) + (token?.length > 50 ? "..." : ""), length: token?.length || 0});
    } catch (err: any) {
      console.error('Error getting token:', err);
      setResult(`Error getting token: ${err.message}`);
    }
  };

  const testAuth = async () => {
    if (!user) {
      setResult('No user logged in')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Get the current user's ID token
      const token = await user.getIdToken();
      console.log('Sending token length:', token?.length || 0);
      
      // Fetch from the test API route
      const res = await fetch("/api/test-auth", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(`API error: ${data.error}`);
      }
      
      setResult(`Success! User ID: ${data.userId}`);
      console.log('Test API response:', data);
    } catch (err: any) {
      console.error('Error testing auth:', err);
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Auth Test</h1>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">User is logged in</p>
            
            <button
              onClick={getTokenInfo}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 mb-4"
            >
              Get Token Info
            </button>
            
            {tokenInfo.token && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Token length: {tokenInfo.length}</p>
                <p className="text-xs text-gray-500 break-all mt-2">{tokenInfo.token}</p>
              </div>
            )}
            
            <button
              onClick={testAuth}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Authentication'}
            </button>
          </div>
        ) : (
          <p className="text-red-600 font-medium">No user logged in</p>
        )}
        
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-800">{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}