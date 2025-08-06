import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

interface PDFGenerationRequest {
  htmlContent: string
  filename: string
  patientName?: string
  doctorName?: string
}

export async function POST(req: NextRequest) {
  try {
    const { htmlContent, filename, patientName, doctorName }: PDFGenerationRequest = await req.json()

    if (!htmlContent) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    // For now, we'll return the HTML content as a downloadable file
    // In production, you would use a PDF generation library here
    const response = new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

    return response
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}