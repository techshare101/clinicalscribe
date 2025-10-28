export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { adminBucket, adminDb, adminAuth } from "@/lib/firebase-admin";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import sanitizeHtml from "sanitize-html";

// Environment detection
const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_URL;

// Clinical-grade CSS template matching the polished design
const getClinicalCSS = () => {
  return `
    <style>
      @page {
        size: A4;
        margin: 0.75in;
      }
      
      body {
        font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.5;
        color: #222;
        margin: 0;
        padding: 0;
        font-size: 11pt;
        /* Subtle diagonal watermark pattern */
        background: 
          repeating-linear-gradient(
            45deg,
            rgba(0, 102, 204, 0.015) 0px,
            rgba(0, 102, 204, 0.015) 25px,
            transparent 25px,
            transparent 50px
          );
      }
      
      /* Blue header bar */
      .document-header {
        background: #0066cc;
        color: white;
        padding: 16px 24px;
        border-radius: 8px 8px 0 0;
        text-align: center;
        font-size: 18px;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 0;
        letter-spacing: 1px;
      }
      
      /* Main container with border */
      .document-container {
        border: 1px solid #ddd;
        border-radius: 0 0 8px 8px;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        padding: 24px;
        margin-top: 0;
      }
      
      /* Patient metadata section */
      .patient-meta {
        font-size: 12px;
        color: #555;
        margin-bottom: 20px;
        padding: 12px;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
      }
      
      .patient-meta strong {
        color: #333;
      }
      
      /* SOAP Section styling */
      .section {
        margin: 20px 0;
        padding-left: 16px;
        border-left: 5px solid #999;
        page-break-inside: avoid;
      }
      
      /* Color-coded left borders for SOAP sections */
      .section.subjective {
        border-left-color: #00b050; /* Green */
      }
      
      .section.objective {
        border-left-color: #0070c0; /* Blue */
      }
      
      .section.assessment {
        border-left-color: #ff6600; /* Orange */
      }
      
      .section.plan {
        border-left-color: #c00000; /* Red */
      }
      
      .section.transcript {
        border-left-color: #7030a0; /* Purple */
      }
      
      /* Section headers */
      .section h2 {
        text-transform: uppercase;
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #111;
        letter-spacing: 0.5px;
      }
      
      .section p {
        margin: 8px 0;
        line-height: 1.6;
        text-align: justify;
      }
      
      /* Lists within sections */
      .section ul, .section ol {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .section li {
        margin: 4px 0;
      }
      
      /* Tables */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        font-size: 10pt;
      }
      
      th, td {
        border: 1px solid #d1d5db;
        padding: 8px;
        text-align: left;
      }
      
      th {
        background-color: #f3f4f6;
        font-weight: 600;
        color: #374151;
      }
      
      /* Signature section */
      .signature-section {
        border: 1px solid #ccc;
        border-radius: 6px;
        margin-top: 32px;
        padding: 16px;
        text-align: center;
        background-color: #fafafa;
      }
      
      .signature-section h3 {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
      }
      
      .signature-section .signature-image {
        max-width: 300px;
        height: auto;
        margin: 12px 0;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
        display: block;
      }
      
      .signature-section .signature-date {
        font-size: 10px;
        color: #777;
        margin-top: 8px;
      }
      
      /* Enhanced signature image styling for any img in signature sections */
      .signature-section img {
        max-width: 300px !important;
        height: auto !important;
        margin: 12px auto !important;
        border: 1px solid #d1d5db !important;
        border-radius: 4px !important;
        background: white !important;
        display: block !important;
      }
      
      /* Document footer */
      .document-footer {
        font-size: 10px;
        color: #777;
        text-align: center;
        border-top: 1px solid #ddd;
        margin-top: 32px;
        padding-top: 12px;
      }
      
      /* Print optimizations */
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        
        .section {
          break-inside: avoid;
        }
        
        h1, h2, h3 {
          break-after: avoid;
        }
        
        .document-header {
          break-after: avoid;
        }
      }
      
      /* General typography */
      h1, h2, h3, h4 {
        font-weight: 600;
        color: #111;
      }
      
      p {
        margin: 8px 0;
      }
      
      strong {
        font-weight: 600;
      }
      
      /* Ensure colors print correctly */
      * {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    </style>
  `;
};

// Helper function to find system Chrome installation
const getSystemChromePath = (): string => {
  const possiblePaths = [
    // Windows paths
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // macOS paths
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // Linux paths
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  
  // If no Chrome found, return empty string to let Puppeteer handle it
  return '';
};

export async function POST(req: NextRequest) {
  const tmpPath = path.join(os.tmpdir(), `${uuidv4()}.pdf`);

  try {
    // 🔐 Authenticate user from token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    console.log(`[PDF Render] Authenticated user: ${userId}`);

    // Get request body
    const { html, noteId, signature, patientId, patientName, docLang } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
    }

    console.log(`[PDF Render] HTML content received (${html.length} characters)`);
    
    // Check if HTML contains signature images
    const hasSignatureImage = html.includes('data:image/png;base64') || html.includes('<img');
    console.log(`[PDF Render] Contains signature image: ${hasSignatureImage}`);

    // 🧹 Sanitize incoming HTML with support for signature images
    const safeHtml = sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img", "table", "tr", "td", "thead", "tbody", "th", "div", "span", "strong", "em", "br"
      ]),
      allowedAttributes: {
        "*": ["style", "class", "aria-hidden"],
        "img": ["src", "alt", "style", "class", "width", "height"],
        "div": ["style", "class"],
        "span": ["style", "class"],
        "p": ["style", "class"],
        "strong": ["style", "class"],
        "em": ["style", "class"],
      },
      allowedSchemes: ["data", "http", "https"], // Allow data URLs for signatures
      allowedSchemesByTag: {
        img: ["data", "http", "https"] // Specifically allow data URLs for images
      }
    });

    // 🧱 Puppeteer launch with @sparticuz/chromium
    let executablePath: string;
    try {
      executablePath = await chromium.executablePath();
      if (!executablePath || executablePath.includes('/tmp/chromium')) {
        // Force the correct path if executablePath() returns invalid path
        executablePath = '/var/task/node_modules/@sparticuz/chromium/bin/headless_shell';
      }
    } catch (error) {
      console.warn('⚠️ chromium.executablePath() failed, using fallback');
      executablePath = '/var/task/node_modules/@sparticuz/chromium/bin/headless_shell';
    }
    console.log('🚀 [PDF Render] Launching Chromium from:', executablePath);
    console.log('🔍 Environment: Vercel=', isVercel, ', Node=', process.version);
    console.log('📦 @sparticuz/chromium args count:', chromium.args.length);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
      });
      
      // 💡 Debug info: log Chromium version + memory footprint
      const version = await browser.version();
      const metrics = await browser.target().createCDPSession();
      const perf = await metrics.send("Performance.getMetrics");
      console.log('🧠 Chromium Version:', version);
      console.log('📊 Runtime Metrics (MB):', {
        jsHeapUsed: (perf.metrics.find((m: any) => m.name === "JSHeapUsedSize")?.value ?? 0) / 1_000_000,
        jsHeapTotal: (perf.metrics.find((m: any) => m.name === "JSHeapTotalSize")?.value ?? 0) / 1_000_000,
      });
      console.log('✅ [PDF Render] Browser launched successfully');
    } catch (launchError: any) {
      console.error('❌ [PDF Render] Browser launch failed:', {
        message: launchError.message,
        stack: launchError.stack?.substring(0, 500),
        name: launchError.name
      });
      
      // More specific error messages for debugging
      if (launchError.message.includes('libnss3.so') || 
          launchError.message.includes('shared libraries') ||
          launchError.message.includes('libatk') ||
          launchError.message.includes('libcups')) {
        throw new Error(`PDF generation service is not available. Missing system libraries: ${launchError.message}`);
      }
      
      // Re-throw with full error message for debugging
      throw new Error(`Browser launch failed: ${launchError.message}`);
    }

    const page = await browser.newPage();
    
    // Generate clinical-grade CSS and complete HTML document
    const clinicalCSS = getClinicalCSS();
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
    
    const completeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>SOAP Note - ClinicalScribe</title>
          ${clinicalCSS}
        </head>
        <body>
          <div class="document-header">SOAP Note</div>
          <div class="document-container">
            ${safeHtml}
          </div>
          <div class="document-footer">
            ClinicalScribe Beta — Generated ${currentDate}
          </div>
        </body>
      </html>
    `;
    
    await page.setContent(completeHtml, { waitUntil: "domcontentloaded" });

    console.log("[PDF Render] Generating PDF...");
    const pdfBuffer = await page.pdf({ 
      format: "A4", 
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size:10px;width:100%;padding:0 1in;color:#666;
                    text-align:right;font-family:'Segoe UI',sans-serif;
                    display:flex;justify-content:space-between;align-items:center;">
          <span>ClinicalScribe Beta</span>
          <span>Generated ${currentDate}${signature ? ' • Signed by ' + signature : ''}</span>
          <span style="margin-right:1in;"><span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '0.75in',
        right: '0.75in', 
        bottom: '0.75in',
        left: '0.75in'
      },
      preferCSSPageSize: true
    });
    
    await browser.close();
    console.log("✅ [PDF Render] PDF generated successfully");

    // 🗂️ Write + upload inside try/finally to ensure cleanup
    try {
      fs.writeFileSync(tmpPath, pdfBuffer);

      const fileName = `${userId}_${Date.now()}.pdf`;
      const storagePath = `pdfs/${userId}/${fileName}`;

      console.log("[PDF Render] Uploading to Firebase Storage...");
      
      const [uploadResult] = await adminBucket.upload(tmpPath, {
        destination: storagePath,
        metadata: { 
          contentType: "application/pdf",
          metadata: {
            userId,
            createdAt: new Date().toISOString(),
          }
        },
      });

      console.log(`[PDF Render] Successfully uploaded to ${storagePath}`);

      // 🔗 Generate signed URL that bypasses Storage Rules
      const file = adminBucket.file(storagePath);
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2080", // Long-lived signed URL
      });

      console.log("[PDF Render] Signed URL generated successfully");

      // 🧾 Save PDF metadata to Firestore
      if (noteId) {
        try {
          await adminDb.collection("soapNotes").doc(noteId).set({
            userId: userId,
            patientId: patientId || "unknown",
            patientName: patientName || "Unknown Patient",
            filePath: storagePath,
            pdfUrl: signedUrl,
            createdAt: new Date().toISOString(),
            status: "generated",
            language: docLang || "en",
          }, { merge: true });
          
          console.log("✅ PDF metadata written to Firestore:", noteId);
        } catch (firestoreError: any) {
          console.error("❌ Failed to write PDF metadata:", firestoreError);
          // Don't fail the entire request if Firestore write fails
        }
      }

      return NextResponse.json({
        success: true,
        url: signedUrl,
        filePath: storagePath,
        message: "PDF generated and uploaded successfully",
      });
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  } catch (e: any) {
    console.error("[PDF Render Error]", e);
    return NextResponse.json(
      { error: e?.message || "Failed to render PDF" },
      { status: 500 }
    );
  }
}
