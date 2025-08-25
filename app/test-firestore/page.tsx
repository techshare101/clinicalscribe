'use client'

import { useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function TestFirestorePage() {
  useEffect(() => {
    const testFirestore = async () => {
      try {
        console.log('Testing Firestore connection...')
        console.log('db instance:', db)
        console.log('db type:', typeof db)
        console.log('db constructor name:', db?.constructor?.name)
        console.log('Is Firestore instance?', db instanceof Object && db.constructor?.name === 'Firestore')
        
        // Try a simple query
        const testCollection = collection(db, 'test')
        console.log('Collection reference created:', testCollection)
        
        // Try to get docs (this might fail, but we'll catch it)
        const snapshot = await getDocs(testCollection)
        console.log('Query successful, docs count:', snapshot.size)
      } catch (error) {
        console.error('Firestore test error:', error)
      }
    }
    
    testFirestore()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firestore Test</h1>
      <p>Check the browser console for test results.</p>
    </div>
  )
}