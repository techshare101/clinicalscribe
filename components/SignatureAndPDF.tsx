'use client'

import React, { useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { uploadToFirebase } from '@/lib/storage'
import { auth } from '@/lib/firebase'
import { FileText, Upload, Download, Signature, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'

interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  patientName?: string
  encounterType?: string
  timestamp: string
}

interface SignatureAndPDFProps {
  soapNote?: SOAPNote
  patientName?: string
  encounterType?: string
}

export default function SignatureAndPDF({
  soapNote,
  patientName = '',
  encounterType = '',
}: SignatureAndPDFProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [doctorName, setDoctorName] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null) // legacy field; no longer used for Firebase
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const { toast } = useToast()

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up canvas for better drawing
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#000000'

    // Set canvas background to white
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Get coordinates relative to canvas
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      }
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }
  }

  // Mouse events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e)
    setLastPoint(coords)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords = getCoordinates(e)

    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()

    setLastPoint(coords)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setLastPoint(null)
  }

  // Touch events for mobile support
  const startTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const coords = getCoordinates(e)
    setLastPoint(coords)
    setIsDrawing(true)
  }

  const touchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing || !lastPoint) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords = getCoordinates(e)

    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()

    setLastPoint(coords)
  }

  const stopTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(false)
    setLastPoint(null)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  const isSignatureEmpty = (): boolean => {
    const canvas = canvasRef.current
    if (!canvas) return true

    const ctx = canvas.getContext('2d')
    if (!ctx) return true

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Check if any pixel is not white (255, 255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255 || data[i + 3] !== 255) {
        return false
      }
    }
    return true
  }

  const generateHTMLContent = (): string => {
    const canvas = canvasRef.current
    const signatureDataUrl = canvas?.toDataURL('image/png') || ''

    const currentDate = new Date().toLocaleString()

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>SOAP Note - ${patientName || 'Patient'}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              margin: 40px;
              color: #333;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1e40af;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #6b7280;
              margin: 5px 0 0 0;
              font-size: 14px;
            }
            .metadata {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              border: 1px solid #e2e8f0;
            }
            .metadata-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .metadata-row:last-child {
              margin-bottom: 0;
            }
            .section {
              margin-bottom: 25px;
              padding: 20px;
              border-left: 5px solid #e5e7eb;
              background: #fafafa;
              border-radius: 0 8px 8px 0;
            }
            .section-title {
              font-weight: bold;
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .section-content {
              font-size: 14px;
              line-height: 1.7;
              color: #374151;
            }
            .signature-section {
              margin-top: 40px;
              padding: 25px;
              border: 2px solid #d1d5db;
              border-radius: 12px;
              background: #ffffff;
            }
            .signature-section h3 {
              color: #1f2937;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .signature-image {
              max-width: 400px;
              height: auto;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              margin: 15px 0;
              background: white;
            }
            .signature-details {
              background: #f9fafb;
              padding: 15px;
              border-radius: 6px;
              margin-top: 15px;
            }
            .subjective { border-left-color: #10b981; }
            .objective { border-left-color: #3b82f6; }
            .assessment { border-left-color: #f59e0b; }
            .plan { border-left-color: #ef4444; }

            @media print {
              body { margin: 20px; }
              .signature-section { break-inside: avoid; }
            }
            ${true ? `
            .watermark {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              pointer-events: none;
              background-image: repeating-linear-gradient(
                45deg,
                rgba(37, 99, 235, 0.08) 0,
                rgba(37, 99, 235, 0.08) 40px,
                rgba(255, 255, 255, 0.0) 40px,
                rgba(255, 255, 255, 0.0) 120px
              );
            }
            .watermark-text {
              position: fixed;
              top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-20deg);
              font-size: 48px;
              color: rgba(37, 99, 235, 0.15);
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            ` : ''}
          </style>
        </head>
        <body>
          ${true ? `
          <div class="watermark" aria-hidden="true"></div>
          <div class="watermark-text" aria-hidden="true">ClinicalScribe Beta</div>
          ` : ''}
          <div class="header">
            <h1>SOAP Note</h1>
            <p>Clinical Documentation System</p>
          </div>

          <div class="metadata">
            <div class="metadata-row">
              <strong>Patient Name:</strong>
              <span>${patientName || 'N/A'}</span>
            </div>
            <div class="metadata-row">
              <strong>Encounter Type:</strong>
              <span>${encounterType || 'N/A'}</span>
            </div>
            <div class="metadata-row">
              <strong>Document Date:</strong>
              <span>${currentDate}</span>
            </div>
            <div class="metadata-row">
              <strong>Generated:</strong>
              <span>${soapNote?.timestamp || currentDate}</span>
            </div>
          </div>

          ${soapNote ? `
            <div class="section subjective">
              <div class="section-title">Subjective</div>
              <div class="section-content">${soapNote.subjective}</div>
            </div>

            <div class="section objective">
              <div class="section-title">Objective</div>
              <div class="section-content">${soapNote.objective}</div>
            </div>

            <div class="section assessment">
              <div class="section-title">Assessment</div>
              <div class="section-content">${soapNote.assessment}</div>
            </div>

            <div class="section plan">
              <div class="section-title">Plan</div>
              <div class="section-content">${soapNote.plan}</div>
            </div>
          ` : `
            <div class="section">
              <div class="section-content">
                <em>No SOAP note data available. This document contains signature verification only.</em>
              </div>
            </div>
          `}

          <div class="signature-section">
            <h3>Healthcare Provider Verification</h3>
            <div class="signature-details">
              <p><strong>Signed by:</strong> ${doctorName}</p>
              <p><strong>Date & Time:</strong> ${currentDate}</p>
              <p><strong>Digital Signature:</strong></p>
              ${signatureDataUrl ? `<img src="${signatureDataUrl}" alt="Digital Signature" class="signature-image" />` : '<p><em>No signature provided</em></p>'}
            </div>
          </div>
        </body>
      </html>
    `
  }

  const generateAndUploadPDF = async () => {
    if (!doctorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before generating the PDF.",
        variant: "destructive"
      })
      return
    }

    if (isSignatureEmpty()) {
      toast({
        title: "Signature Required", 
        description: "Please provide your signature before generating the PDF.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setStatusMessage('📄 Generating PDF document...')

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Please sign in to generate PDF')
      }

      // Get fresh ID token for authentication
      const idToken = await user.getIdToken(true)
      
      // Generate HTML content for PDF
      const htmlContent = generateHTMLContent()
      
      setStatusMessage('☁️ Uploading to Storage...')
      
      // Call PDF render API
      const response = await fetch('/api/pdf/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          html: htmlContent,
          ownerId: user.uid
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate PDF')
      }
      
      if (result.success && result.url) {
        setUploadedPath(result.filePath)
        setUploadUrl(result.url)
        setStatusMessage('✅ PDF uploaded successfully!')
        
        toast({
          title: "PDF Generated Successfully!",
          description: "Your document has been generated and uploaded to secure storage.",
          variant: "default"
        })
        
        console.log('🎉 PDF generated and uploaded:', result.filePath)
      } else {
        throw new Error('PDF generation failed - no URL returned')
      }
      
    } catch (error: any) {
      console.error('[SignatureAndPDF] PDF generation error:', error)
      setStatusMessage(`❌ PDF generation failed`)
      
      toast({
        title: "PDF Generation Failed",
        description: error.message || "An error occurred while generating the PDF. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGetSignedUrl = async () => {
    try {
      const user = auth.currentUser
      const idToken = await user?.getIdToken()
      if (!idToken) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to open the document.",
          variant: "destructive"
        })
        return
      }
      const res = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ path: uploadedPath, expiresInSec: 300 }),
      })
      const { url, error } = await res.json()
      if (error || !url) throw new Error(error || 'No URL returned')
      window.open(url, '_blank')
      
      toast({
        title: "Document Opened",
        description: "Your document is opening in a new tab.",
        variant: "default"
      })
    } catch (e: any) {
      console.error('[SignatureAndPDF] Get signed URL error:', e)
      
      toast({
        title: "Failed to Open Document",
        description: e.message || "Could not generate download link. Please try again.",
        variant: "destructive"
      })
    }
  }

  const downloadDocument = async () => {
    if (!doctorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before downloading.",
        variant: "destructive"
      })
      return
    }

    if (isSignatureEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature before downloading.",
        variant: "destructive"
      })
      return
    }

    try {
      const user = auth.currentUser
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to download the document.",
          variant: "destructive"
        })
        return
      }

      // Get fresh ID token for authentication
      const idToken = await user.getIdToken(true)
      
      // Generate HTML content for PDF
      const htmlContent = generateHTMLContent()
      
      // Call PDF render API
      const response = await fetch('/api/pdf/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          html: htmlContent,
          ownerId: user.uid
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate PDF')
      }
      
      if (result.success && result.url) {
        // Download the PDF directly
        window.open(result.url, '_blank')
        
        toast({
          title: "Download Started",
          description: "Your PDF document is being downloaded.",
          variant: "default"
        })
      } else {
        throw new Error('PDF generation failed - no URL returned')
      }
      
    } catch (error: any) {
      console.error('[SignatureAndPDF] PDF download error:', error)
      
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download PDF. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signature className="h-5 w-5" />
            Digital Signature & Document Generation
          </CardTitle>
          <CardDescription>
            Sign the SOAP note and generate a document for secure storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Doctor Name Input */}
          <div className="space-y-2">
            <Label htmlFor="doctorName">Healthcare Provider Name *</Label>
            <Input
              id="doctorName"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Enter your full name"
              className="max-w-md"
            />
          </div>

          {/* Signature Pad */}
          <div className="space-y-2">
            <Label>Digital Signature *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="border border-gray-300 rounded cursor-crosshair bg-white touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startTouchDrawing}
                onTouchMove={touchDraw}
                onTouchEnd={stopTouchDrawing}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear Signature
                </Button>
                <span className="text-xs text-gray-500 flex items-center">
                  Sign above using your mouse or touch screen
                </span>
              </div>
            </div>
          </div>

          {/* SOAP Note Preview */}
          {soapNote && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  SOAP Note Preview
                </h3>
                <div className="grid gap-4">
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r">
                    <h4 className="font-medium text-green-800 mb-2">Subjective</h4>
                    <p className="text-sm text-green-700 leading-relaxed">{soapNote.subjective}</p>
                  </div>
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                    <h4 className="font-medium text-blue-800 mb-2">Objective</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">{soapNote.objective}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r">
                    <h4 className="font-medium text-yellow-800 mb-2">Assessment</h4>
                    <p className="text-sm text-yellow-700 leading-relaxed">{soapNote.assessment}</p>
                  </div>
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
                    <h4 className="font-medium text-red-800 mb-2">Plan</h4>
                    <p className="text-sm text-red-700 leading-relaxed">{soapNote.plan}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              onClick={generateAndUploadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isGenerating ? 'Processing...' : 'Generate & Upload PDF'}
            </Button>

            <Button
              variant="outline"
              onClick={downloadDocument}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>

            {uploadedPath && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (uploadUrl) {
                    // Use the direct signed URL from PDF render response
                    window.open(uploadUrl, '_blank')
                  } else {
                    // Fallback: generate new signed URL via API
                    handleGetSignedUrl()
                  }
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {uploadUrl ? 'Download PDF' : 'Open Signed Link'}
              </Button>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <Alert className={uploadedPath ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
              {uploadedPath ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription className={uploadedPath ? 'text-green-800' : 'text-blue-800'}>
                {statusMessage}
                {uploadedPath && (
                  <div className="mt-2 text-xs text-gray-600 break-all">
                    Saved: {uploadedPath}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}