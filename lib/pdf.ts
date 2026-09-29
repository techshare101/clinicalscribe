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
  watermark = '',
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
        'Authorization': `Bearer ${idToken}`,
        'Accept': 'application/json, application/pdf'
      },
      body: JSON.stringify({
        html,
        ownerId: uid,
        format: 'json',
        returnJson: true,
        ...(noteId && { noteId }),
        ...(metadata?.patientId && { patientId: metadata.patientId }),
        ...(metadata?.patientName && { patientName: metadata.patientName }),
        ...(metadata?.docLang && { docLang: metadata.docLang })
      })
    })
    
    if (!response.ok) {
      let errorMsg = 'Failed to generate PDF'
      try {
        const ct = response.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const errObj = await response.json()
          errorMsg = errObj.error || errorMsg
        } else {
          const errText = await response.text()
          errorMsg = errText || errorMsg
        }
      } catch {}
      return {
        success: false,
        error: errorMsg
      }
    }

    const contentType = response.headers.get('content-type') || ''
    let result: any = {}
    
    if (contentType.includes('application/pdf')) {
      const headerUrl = response.headers.get('X-PDF-URL') || response.headers.get('x-pdf-url')
      const headerPath = response.headers.get('X-PDF-Path') || response.headers.get('x-pdf-path') || (uid && noteId ? `pdfs/${uid}/${noteId}.pdf` : undefined)
      result = {
        success: true,
        url: headerUrl || undefined,
        path: headerPath,
        filePath: headerPath
      }
    } else {
      result = await response.json()
    }
    
    return {
      success: result.success !== false,
      url: result.url,
      path: result.path || result.filePath
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
        'Authorization': `Bearer ${idToken}`,
        'Accept': 'application/pdf, application/json'
      },
      body: JSON.stringify({
        html,
        ownerId: uid,
        noteId,
        format: 'pdf'
      })
    })
    
    if (!response.ok) {
      let errorMsg = 'Failed to generate PDF'
      try {
        const ct = response.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const errObj = await response.json()
          errorMsg = errObj.error || errorMsg
        } else {
          const errText = await response.text()
          errorMsg = errText || errorMsg
        }
      } catch {}
      throw new Error(errorMsg)
    }
    
    // Get PDF URL from headers if available (Firebase Storage URL)
    let pdfUrl = response.headers.get('X-PDF-URL') || response.headers.get('x-pdf-url')
    const contentType = response.headers.get('content-type') || ''
    let blob: Blob
    
    if (contentType.includes('application/pdf')) {
      blob = await response.blob()
    } else {
      const jsonResult = await response.json()
      pdfUrl = jsonResult.url || pdfUrl
      if (pdfUrl) {
        const fileRes = await fetch(pdfUrl)
        blob = await fileRes.blob()
      } else {
        throw new Error('No PDF download URL returned from server')
      }
    }
    
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
