'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { uploadToFirebase } from '@/lib/storage'
import { auth, storage } from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { FileText, Upload, Download, Signature, CheckCircle, AlertCircle, Trash2, User, Loader2, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/formatDate'

interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  patientName?: string
  encounterType?: string
  timestamp: string
}

interface SignatureData {
  doctorName: string;
  signatureDataUrl?: string;
}

interface SignatureAndPDFProps {
  soapNote?: SOAPNote
  patientName?: string
  encounterType?: string
  rawTranscript?: string
  translatedTranscript?: string
  patientLang?: string
  docLang?: string
}

export default function SignatureAndPDF({
  soapNote,
  patientName = '',
  encounterType = '',
  rawTranscript = '',
  translatedTranscript = '',
  patientLang = 'en',
  docLang = 'en'
}: SignatureAndPDFProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [doctorName, setDoctorName] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [restored, setRestored] = useState(false)
  const { toast } = useToast()

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("signatureData");
    if (saved) {
      try {
        const data: SignatureData = JSON.parse(saved);
        setDoctorName(data.doctorName || "");
        setRestored(true);
        
        // Restore signature if it exists
        if (data.signatureDataUrl && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
            };
            img.src = data.signatureDataUrl;
          }
        }
      } catch (error) {
        console.error("Failed to parse saved signature data:", error);
        localStorage.removeItem("signatureData"); // Clear corrupted data
      }
    }
  }, []);

  // Save doctor name to localStorage whenever it changes
  useEffect(() => {
    if (doctorName) {
      const signatureData: SignatureData = {
        doctorName: doctorName,
      };
      localStorage.setItem("signatureData", JSON.stringify(signatureData));
    }
  }, [doctorName]);

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
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

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
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
    saveSignatureToLocalStorage(); // Save signature whenever drawing stops
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

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
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
    saveSignatureToLocalStorage(); // Save signature whenever drawing stops
  }

  // Save signature to localStorage
  const saveSignatureToLocalStorage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureDataUrl = canvas.toDataURL('image/png');
      const currentData = localStorage.getItem("signatureData");
      let data: SignatureData = { doctorName: doctorName };
      
      if (currentData) {
        try {
          data = JSON.parse(currentData);
        } catch (error) {
          console.error("Failed to parse existing signature data:", error);
        }
      }
      
      data = { ...data, signatureDataUrl };
      localStorage.setItem("signatureData", JSON.stringify(data));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    // Also clear signature from localStorage
    const currentData = localStorage.getItem("signatureData");
    if (currentData) {
      try {
        const data: SignatureData = JSON.parse(currentData);
        delete data.signatureDataUrl;
        localStorage.setItem("signatureData", JSON.stringify(data));
      } catch (error) {
        console.error("Failed to update signature data:", error);
        localStorage.removeItem("signatureData");
      }
    }
  }

  const clearAllData = () => {
    setDoctorName('');
    clearSignature();
    setRestored(false);
    localStorage.removeItem("signatureData");
  };

  const isSignatureEmpty = (): boolean => {
    const canvas = canvasRef.current
    if (!canvas) return true

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
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

    const currentDate = formatDate(new Date())

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
            <div class="metadata-row">
              <strong>Patient Language:</strong>
              <span>${
                patientLang === "auto" ? "🌐 Auto Detected" :
                patientLang === "so" ? "🇸🇴 Somali" :
                patientLang === "hmn" ? "🇱🇦 Hmong" :
                patientLang === "sw" ? "🇰🇪 Swahili" :
                patientLang === "ar" ? "🇸🇦 Arabic" :
                patientLang === "en" ? "🇺🇸 English" :
                patientLang.toUpperCase()
              }</span>
            </div>
            <div class="metadata-row">
              <strong>Documentation Language:</strong>
              <span>${
                docLang === "en" ? "🇺🇸 English" :
                docLang === "so" ? "🇸🇴 Somali" :
                docLang === "hmn" ? "🇱🇦 Hmong" :
                docLang === "sw" ? "🇰🇪 Swahili" :
                docLang === "ar" ? "🇸🇦 Arabic" :
                docLang.toUpperCase()
              }</span>
            </div>
          </div>

          ${rawTranscript && translatedTranscript && rawTranscript !== translatedTranscript ? `
            <div class="section">
              <div class="section-title">Transcript Information</div>
              <div class="section-content">
                <p><strong>Raw Transcript (${
                  patientLang === "auto" ? "🌐 Auto Detected" :
                  patientLang === "so" ? "🇸🇴 Somali" :
                  patientLang === "hmn" ? "🇱🇦 Hmong" :
                  patientLang === "sw" ? "🇰🇪 Swahili" :
                  patientLang === "ar" ? "🇸🇦 Arabic" :
                  patientLang === "en" ? "🇺🇸 English" :
                  patientLang.toUpperCase()
                }):</strong></p>
                <p>${rawTranscript}</p>
                <p style="margin-top: 15px;"><strong>Translated Transcript (${
                  docLang === "en" ? "🇺🇸 English" :
                  docLang === "so" ? "🇸🇴 Somali" :
                  docLang === "hmn" ? "🇱🇦 Hmong" :
                  docLang === "sw" ? "🇰🇪 Swahili" :
                  docLang === "ar" ? "🇸🇦 Arabic" :
                  docLang.toUpperCase()
                }):</strong></p>
                <p>${translatedTranscript}</p>
              </div>
            </div>
          ` : `
            <div class="section">
              <div class="section-title">Transcript</div>
              <div class="section-content">
                <p>${translatedTranscript || rawTranscript || 'No transcript available'}</p>
              </div>
            </div>
          `}

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

  const saveSOAPNoteToFirestore = async () => {
    if (!doctorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before saving the SOAP note.",
        variant: "destructive"
      })
      return
    }

    if (isSignatureEmpty()) {
      toast({
        title: "Signature Required", 
        description: "Please provide your signature before saving the SOAP note.",
        variant: "destructive"
      })
      return
    }

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Please sign in to save SOAP notes')
      }

      // Generate a unique ID for the SOAP note
      const noteId = `${user.uid}_${Date.now()}`
      
      // Save SOAP note to Firestore with both raw and translated transcripts
      await setDoc(doc(db, "soapNotes", noteId), {
        userId: user.uid,
        rawTranscript,                      // Patient's original language
        transcript: translatedTranscript,   // Documentation language
        patientLang: patientLang,           // Patient language code (e.g., 'so', 'hmn')
        docLang: docLang,                   // Documentation language code (e.g., 'en')
        soap: soapNote,
        patientName: patientName,
        encounterType: encounterType,
        doctorName: doctorName,
        createdAt: new Date()
      }, { merge: true })

      toast({
        title: "SOAP Note Saved",
        description: "Your SOAP note has been successfully saved to Firestore.",
        variant: "default"
      })
      
      console.log('🎉 SOAP note saved to Firestore:', noteId)
    } catch (error: any) {
      console.error('[SignatureAndPDF] Save to Firestore error:', error)
      
      toast({
        title: "Failed to Save SOAP Note",
        description: error.message || "Could not save SOAP note to Firestore. Please try again.",
        variant: "destructive"
      })
    }
  }

  const generateAndUploadPDF = async () => {
    if (!doctorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before generating the PDF.",
        variant: "destructive"
      });
      return;
    }

    if (isSignatureEmpty()) {
      toast({
        title: "Signature Required", 
        description: "Please provide your signature before generating the PDF.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setStatusMessage('📄 Generating PDF document...');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Please sign in to generate PDF');
      }

      // Get fresh ID token for authentication
      const idToken = await user.getIdToken(true);
      
      // Generate HTML content for PDF
      const htmlContent = generateHTMLContent();
      
      setStatusMessage('☁️ Generating and uploading PDF...');
      
      // Call PDF API with timeout - use the working /api/pdf/render endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout to match backend
      
      // Generate a unique note ID for this PDF
      const noteId = `${user.uid}_${Date.now()}`;
      
      // Call the working PDF render API that handles everything
      const response = await fetch('/api/pdf/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          html: htmlContent,
          noteId: noteId,
          signature: doctorName,
          patientId: patientName ? patientName.replace(/\s+/g, '_') : 'unknown',
          patientName: patientName || 'Unknown Patient',
          docLang: docLang || 'en'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to generate PDF');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'PDF generation failed');
      }
      
      // Store the URL and path from the successful generation
      setUploadUrl(result.url);
      setUploadedPath(result.filePath);
      setStatusMessage('✅ PDF generated and uploaded successfully!');
      
      toast({
        title: "PDF Generated Successfully!",
        description: "Your document has been generated and uploaded to secure storage.",
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('[SignatureAndPDF] PDF generation error:', error);
      setStatusMessage(`❌ PDF generation failed`);
      
      // Handle timeout specifically
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        toast({
          title: "PDF Generation Timeout",
          description: "The PDF generation is taking longer than expected. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "PDF Generation Failed",
          description: error.message || "An error occurred while generating the PDF. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const handleGetSignedUrl = async () => {
    try {
      // Use the direct Firebase Storage URL from the render API
      if (!uploadUrl) {
        toast({
          title: "No Document Available",
          description: "Please generate a PDF first.",
          variant: "destructive"
        })
        return
      }
      
      // Open the permanent Firebase Storage URL directly
      window.open(uploadUrl, '_blank')
      
      toast({
        title: "Document Opened",
        description: "Your document is opening in a new tab.",
        variant: "default"
      })
    } catch (e: any) {
      console.error('[SignatureAndPDF] Open document error:', e)
      
      toast({
        title: "Failed to Open Document",
        description: e.message || "Could not open document. Please try again.",
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
      
      // Show generating status
      setStatusMessage('📄 Generating PDF document...')
      setIsGenerating(true)
      
      // Generate noteId for this PDF
      const noteId = `${user.uid}_${Date.now()}`
      
      // Call PDF render API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout
      
      const response = await fetch('/api/pdf/render', {
        method: 'POST',
        body: htmlContent, // Send HTML directly as text
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to generate PDF')
      }
      
      // Read the PDF as a blob
      const blob = await response.blob()
      console.log('[PDF Download] PDF blob received, size:', blob.size, 'bytes')
      
      // Upload to Firebase Storage
      setStatusMessage('☁️ Uploading to cloud storage...')
      const fileName = `clinicalscribe-report-${noteId}.pdf`
      const storageRef = ref(storage, `reports/${user.uid}/${fileName}`)
      
      try {
        await uploadBytes(storageRef, blob)
        console.log('[Upload] PDF uploaded successfully to Firebase Storage')
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef)
        console.log('[Upload] Download URL obtained:', downloadURL)
        
        // Update Firestore with PDF URL
        await setDoc(
          doc(db, 'soapNotes', noteId),
          {
            pdfUrl: downloadURL,
            pdfPath: `reports/${user.uid}/${fileName}`,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
        console.log('[SOAP Update] Added PDF URL to Firestore')
        
      } catch (uploadError: any) {
        console.error('[Upload Error]', uploadError)
        // Continue with download even if upload fails
        toast({
          title: "Upload Warning",
          description: "PDF generated but cloud upload failed. File will still download.",
          variant: "default"
        })
      }
      
      // Download the PDF locally
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: "Download Started",
        description: "Your PDF document is being downloaded.",
        variant: "default"
      })
      
    } catch (error: any) {
      console.error('[SignatureAndPDF] PDF download error:', error)
      
      // Handle timeout specifically
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        toast({
          title: "PDF Generation Timeout",
          description: "The PDF generation is taking longer than expected. Please try again.",
          variant: "destructive"
        })
      } else if (error.message.includes('Failed to launch the browser process')) {
        toast({
          title: "PDF Generation Failed",
          description: "There was an issue with the PDF generation service. Please try again later.",
          variant: "destructive"
        })
      } else if (error.message.includes('bucket does not exist') || error.message.includes('Firebase Storage')) {
        toast({
          title: "Storage Setup Required",
          description: "Firebase Storage needs to be enabled. Please contact your administrator.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Download Failed",
          description: error.message || "Failed to download PDF. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsGenerating(false)
      setStatusMessage('')
    }
  }

  // New function to generate PDF and upload to Firestore
  const generateAndUploadToFirestore = async () => {
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
      
      setStatusMessage('☁️ Generating PDF...')
      
      // Generate noteId for this PDF
      const noteId = `${user.uid}_${Date.now()}`
      
      // Call PDF render API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout
      
      const response = await fetch('/api/pdf/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          html: htmlContent,
          noteId: noteId,
          patientId: patientName || 'unknown',
          patientName: patientName || 'Unknown Patient',
          docLang: docLang || 'en'
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate PDF')
      }
      
      if (result.success && result.filePath) {
        // Store the file path in state
        setUploadedPath(result.filePath)
        setUploadUrl(result.url)
        setStatusMessage('✅ PDF generated and uploaded to Firestore successfully!')
        
        toast({
          title: "PDF Generated Successfully!",
          description: "Your document has been generated and uploaded to Firestore.",
          variant: "default"
        })
      } else {
        throw new Error('PDF generation failed - no file path returned')
      }
      
    } catch (error: any) {
      console.error('[SignatureAndPDF] PDF generation error:', error)
      setStatusMessage(`❌ PDF generation failed`)
      
      // Handle timeout specifically
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        toast({
          title: "PDF Generation Timeout",
          description: "The PDF generation is taking longer than expected. Please try again.",
          variant: "destructive"
        })
      } else if (error.message.includes('Failed to launch the browser process')) {
        toast({
          title: "PDF Generation Failed",
          description: "There was an issue with the PDF generation service. Please try again later.",
          variant: "destructive"
        })
      } else if (error.message.includes('bucket does not exist') || error.message.includes('Firebase Storage')) {
        toast({
          title: "Storage Setup Required",
          description: "Firebase Storage needs to be enabled. Please contact your administrator to enable Cloud Storage.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "PDF Generation Failed",
          description: error.message || "An error occurred while generating the PDF. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Restoration Warning */}
      {restored && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">Restored saved signature data</span> - Your doctor name and signature were automatically restored from your previous session.
          </div>
        </div>
      )}

      <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Signature className="h-5 w-5" />
                Digital Signature & PDF Export
              </CardTitle>
              <CardDescription>
                Sign and export your SOAP note as a secure PDF
              </CardDescription>
            </div>
            <Button
              onClick={clearAllData}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="doctor-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Doctor Name
                </Label>
                <Input
                  id="doctor-name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be used to generate your digital signature
                </p>
              </div>

              {/* Signature Canvas */}
              <div>
                <Label className="flex items-center gap-2">
                  <Signature className="h-4 w-4" />
                  Signature
                </Label>
                <div className="mt-1 border-2 border-gray-300 rounded-lg bg-white p-2">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full h-32 cursor-crosshair bg-white rounded"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startTouchDrawing}
                    onTouchMove={touchDraw}
                    onTouchEnd={stopTouchDrawing}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={clearSignature}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear Signature
                  </Button>
                </div>
              </div>
            </div>

            {/* PDF Preview and Actions */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Document Preview</h3>
                <div className="bg-white border rounded-lg p-4 h-64 overflow-y-auto">
                  {soapNote ? (
                    <div className="text-sm space-y-2">
                      <div className="font-bold text-lg border-b pb-2">
                        SOAP Note - {soapNote.patientName || patientName || 'Unknown Patient'}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {formatDate(soapNote.timestamp)} • {encounterType || 'General Consultation'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                        <div>
                          <span className="font-medium">Patient Language:</span> {patientLang?.toUpperCase() || 'EN'}
                        </div>
                        <div>
                          <span className="font-medium">Documentation Language:</span> {docLang?.toUpperCase() || 'EN'}
                        </div>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div>
                          <span className="font-semibold text-blue-700">Subjective:</span>
                          <div className="ml-2">{soapNote.subjective}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-green-700">Objective:</span>
                          <div className="ml-2">{soapNote.objective}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-orange-700">Assessment:</span>
                          <div className="ml-2">{soapNote.assessment}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-purple-700">Plan:</span>
                          <div className="ml-2">{soapNote.plan}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p>SOAP note will appear here after generation</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={downloadDocument}
                  disabled={isGenerating || !soapNote || !doctorName.trim() || isSignatureEmpty()}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Generating PDF...' : 'Generate & Download PDF'}
                </Button>
                
                {/* New button for generating PDF and uploading to Firestore */}
                <Button
                  onClick={generateAndUploadToFirestore}
                  disabled={isGenerating || !soapNote || !doctorName.trim() || isSignatureEmpty()}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Generating PDF...' : 'Generate & Upload to Firestore'}
                </Button>
                
                {statusMessage && (
                  <Alert variant={statusMessage.includes('Error') || statusMessage.includes('❌') ? 'destructive' : 'default'}>
                    {statusMessage.includes('Error') || statusMessage.includes('❌') ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{statusMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}