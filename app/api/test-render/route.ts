import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to test Render PDF service connectivity from Vercel
 * 
 * Visit: https://your-app.vercel.app/api/test-render
 * 
 * This will:
 * 1. Check if RENDER_PDF_URL is set
 * 2. Try to call the Render service
 * 3. Return diagnostic information
 */
export async function GET() {
  const renderUrl = process.env.RENDER_PDF_URL;
  
  console.log('[Test Render] Checking RENDER_PDF_URL...');
  console.log('[Test Render] RENDER_PDF_URL:', renderUrl ? 'SET ✅' : 'NOT SET ❌');
  
  // Check if environment variable is set
  if (!renderUrl) {
    console.error('[Test Render] RENDER_PDF_URL not configured');
    return NextResponse.json({
      success: false,
      error: 'RENDER_PDF_URL environment variable is not configured',
      hint: 'Add RENDER_PDF_URL to Vercel environment variables and redeploy',
      envVarsWithRender: Object.keys(process.env).filter(k => k.includes('RENDER'))
    }, { status: 500 });
  }
  
  console.log('[Test Render] Calling Render service at:', renderUrl);
  
  try {
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test PDF</title></head>
        <body>
          <h1>Test PDF from Vercel</h1>
          <p>Generated at: ${new Date().toISOString()}</p>
          <p>This is a diagnostic test to verify Render service connectivity.</p>
        </body>
      </html>
    `;
    
    const startTime = Date.now();
    const response = await fetch(renderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: testHtml })
    });
    const duration = Date.now() - startTime;
    
    console.log('[Test Render] Response status:', response.status);
    console.log('[Test Render] Response time:', duration, 'ms');
    
    if (!response.ok) {
      const text = await response.text().catch(() => 'Unable to read response body');
      console.error('[Test Render] Render service returned error:', response.status, text);
      
      return NextResponse.json({
        success: false,
        error: 'Render service returned an error',
        renderUrl,
        status: response.status,
        statusText: response.statusText,
        responseBody: text,
        duration,
        hint: 'Check Render service logs for errors'
      }, { status: 500 });
    }
    
    const buffer = await response.arrayBuffer();
    const pdfSize = buffer.byteLength;
    
    console.log('[Test Render] ✅ Success! PDF size:', pdfSize, 'bytes');
    
    return NextResponse.json({
      success: true,
      message: '✅ Render service is reachable from Vercel and working correctly!',
      renderUrl,
      pdfSize,
      duration,
      timestamp: new Date().toISOString(),
      details: {
        environmentVariable: 'RENDER_PDF_URL is set correctly',
        connectivity: 'Vercel can reach Render service',
        pdfGeneration: 'Render service generated PDF successfully',
        responseTime: `${duration}ms`
      }
    });
  } catch (error: any) {
    console.error('[Test Render] Error calling Render service:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      errorType: error.name,
      renderUrl,
      hint: error.message.includes('fetch failed') 
        ? 'Network error - check if Render service is running'
        : 'Check Render service logs for details'
    }, { status: 500 });
  }
}
