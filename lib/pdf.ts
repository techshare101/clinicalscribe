import { auth } from '@/lib/firebase'

/**
 * Renders PDF on server and returns signed download URL
 * This replaces client-side Firebase Storage usage that causes retry errors
 */
export async function renderPdf(html: string, watermark?: string): Promise<Blob> {
  const res = await fetch('/api/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, watermark }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || 'Failed to render PDF')
  }
  return await res.blob()
}

/**
 * Server-side PDF generation and upload with signed URL
 * Eliminates client-side Firebase Storage usage
 */
export async function renderAndUploadPDF(
  html: string, 
  uid: string, 
  docId: string = `doc_${Date.now()}`,
  watermark = 'ClinicalScribe Beta',
  metadata?: {
    patientId?: string
    patientName?: string
    docLang?: string
  }
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Not authenticated')
    }

    // Get fresh ID token for authentication
    const idToken = await user.getIdToken(true)
    
    // Generate noteId if metadata is provided (for Firestore sync)
    const noteId = metadata ? `${uid}_${Date.now()}` : undefined
    
    // Call server-side PDF render API
    const response = await fetch('/api/pdf/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        html,
        ownerId: uid,
        ...(noteId && { noteId }),
        ...(metadata?.patientId && { patientId: metadata.patientId }),
        ...(metadata?.patientName && { patientName: metadata.patientName }),
        ...(metadata?.docLang && { docLang: metadata.docLang })
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to generate PDF'
      }
    }
    
    return {
      success: result.success || false,
      url: result.url,
      path: result.path
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'PDF generation failed'
    }
  }
}

/**
 * Download PDF directly as binary blob and save metadata to Firestore
 * This ensures the PDF appears in SOAP history
 */
export async function downloadPDF(
  html: string,
  uid: string,
  filename: string = 'document.pdf',
  additionalData?: Record<string, any>
): Promise<void> {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Not authenticated')
    }

    const idToken = await user.getIdToken(true)
    const noteId = `${uid}_${Date.now()}`
    
    // Call server-side PDF render API
    const response = await fetch('/api/pdf/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        html,
        ownerId: uid,
        noteId,
      })
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to generate PDF' }))
      throw new Error(error.error || 'Failed to generate PDF')
    }
    
    // Get PDF URL from headers if available (Firebase Storage URL)
    const pdfUrl = response.headers.get('X-PDF-URL')
    
    // Get PDF as blob
    const blob = await response.blob()
    
    if (blob.size === 0) {
      throw new Error('Generated PDF is empty')
    }
    
    // Save metadata to Firestore if we have a URL
    if (pdfUrl) {
      try {
        const { savePDFMeta } = await import('./savePDFMeta')
        await savePDFMeta(pdfUrl, noteId, additionalData)
        console.log('✅ PDF metadata saved to Firestore')
      } catch (firestoreError) {
        console.error('⚠️ Failed to save PDF metadata:', firestoreError)
        // Don't fail the download if Firestore save fails
      }
    }
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('✅ PDF downloaded successfully')
  } catch (error: any) {
    console.error('PDF download error:', error)
    throw error
  }
}
