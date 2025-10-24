'use client'

import ConnectionLifecycle from '@/components/ConnectionLifecycle'

export default function TestConnectionLifecyclePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Connection Lifecycle Test</h1>
        <ConnectionLifecycle />
      </div>
    </div>
  )
}
