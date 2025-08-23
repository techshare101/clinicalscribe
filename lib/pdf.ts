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
  watermark = 'ClinicalScribe Beta'
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Not authenticated')
    }

    // Get fresh ID token for authentication
    const idToken = await user.getIdToken(true)
    
    // Call server-side PDF render API
    const response = await fetch('/api/pdf/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        html,
        ownerId: uid
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
 * Download PDF directly from signed URL
 * No client-side Firebase Storage involved
 */
export async function downloadPDF(
  html: string,
  uid: string,
  filename: string = 'document.pdf'
): Promise<void> {
  try {
    const result = await renderAndUploadPDF(html, uid)
    
    if (result.success && result.url) {
      // Open signed URL for download
      window.open(result.url, '_blank')
    } else {
      throw new Error(result.error || 'Failed to generate PDF')
    }
  } catch (error: any) {
    console.error('PDF download error:', error)
    throw error
  }
}
