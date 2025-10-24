'use client'

import { useState } from 'react'

export default function TestComponent() {
  const [message, setMessage] = useState('Hello, ClinicalScribe!')

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Test Component</h1>
      <p>{message}</p>
      <button 
        onClick={() => setMessage('Components are working correctly!')}
        style={{ 
          padding: '10px 15px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  )
}
