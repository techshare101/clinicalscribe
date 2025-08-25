export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium'
import { adminAuth, adminBucket } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  const timestamp = Date.now()
  console.log(`[PDF Render] Request received at ${new Date(timestamp).toISOString()}`)
  
  try {
    // 🔐 Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[PDF Render] Missing or invalid Authorization header')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token)
    const ownerId = decoded.uid
    console.log(`[PDF Render] Authenticated user: ${ownerId}`)
    
    // Get request body
    const { html } = await req.json()
    if (!html) {
      console.error('[PDF Render] Missing HTML content')
      return NextResponse.json({ success: false, error: 'Missing HTML content' }, { status: 400 })
    }
    
    console.log(`[PDF Render] HTML content received (${html.length} characters)`)
    
    // Set a timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timeout - took longer than 45 seconds')), 45000)
    })
    
    // Main PDF generation promise
    const pdfGenerationPromise = async () => {
      // 🖥 Launch browser
      console.log('[PDF Render] Launching browser...')
      
      let browser
      if (process.env.NODE_ENV === 'production') {
        const puppeteerCore = await import('puppeteer-core')
        browser = await puppeteerCore.default.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: true,
        })
      } else {
        const puppeteer = await import('puppeteer')
        browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
      }
      
      console.log('[PDF Render] Browser launched successfully')
      
      try {
        // Generate PDF with more lenient wait options
        const page = await browser.newPage()
        
        // Set a reasonable timeout for page operations
        page.setDefaultTimeout(30000)
        
        // Use a more efficient wait strategy
        await page.setContent(html, { 
          waitUntil: ['domcontentloaded'] // Faster than networkidle0
        })
        
        const pdfBuffer = await page.pdf({ 
          format: 'A4', 
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          }
        })
        
        await browser.close()
        console.log(`[PDF Render] PDF generated successfully (${pdfBuffer.length} bytes)`)
        
        // ☁️ Upload to Firebase Storage using centralized adminBucket
        console.log('[PDF Render] Uploading to Firebase Storage...')
        const filePath = `pdfs/${ownerId}/${timestamp}.pdf`
        const file = adminBucket.file(filePath)
        
        await file.save(pdfBuffer, { 
          metadata: {
            contentType: 'application/pdf',
            metadata: {
              ownerId,
              createdAt: new Date().toISOString(),
            }
          }
        })
        
        console.log(`[PDF Render] Successfully uploaded to ${filePath}`)
        
        // 🔗 Generate signed URL
        console.log('[PDF Render] Generating signed URL...')
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60, // 1 hour
        })
        
        console.log('[PDF Render] Signed URL generated successfully')
        
        return { 
          success: true, 
          url: signedUrl,
          filePath,
          timestamp 
        }
      } catch (pageError) {
        // Ensure browser is closed even if an error occurs
        if (browser) {
          await browser.close().catch(err => console.error('[PDF Render] Error closing browser:', err))
        }
        throw pageError
      }
    }
    
    // Race the PDF generation against the timeout
    const result = await Promise.race([pdfGenerationPromise(), timeoutPromise])
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('[PDF Render] Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'PDF generation failed',
        timestamp 
      },
      { status: 500 }
    )
  }
}