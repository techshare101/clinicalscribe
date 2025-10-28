export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { adminBucket, adminDb } from "@/lib/firebase-admin";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

// Environment detection
const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_URL;

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
  
  return '';
};

export async function POST(req: NextRequest) {
  try {
    const { html, userId, noteData, watermark } = await req.json();

    if (!html || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Launch Puppeteer using sparticuz chromium (Vercel) or local Chrome (dev)
    let executablePath: string;
    let launchArgs: string[];
    let headlessMode: boolean | 'shell' = true;
    
    if (isVercel) {
      executablePath = await chromium.executablePath();
      // Add --single-process flag to help with library loading on Vercel
      launchArgs = [...chromium.args, '--single-process'];
      headlessMode = chromium.headless;
    } else {
      executablePath = getSystemChromePath();
      if (!executablePath) {
        throw new Error('Chrome not found. Please install Google Chrome or Chromium browser.');
      }
      launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ];
      headlessMode = true;
    }
    
    const browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: headlessMode,
    });

    const page = await browser.newPage();

    const wmCss = watermark
      ? `<style>@page { margin: 56px; } body::before { content: '${(watermark as string).replace(/'/g, "\\'")}'; position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 64px; color: rgba(200,0,0,0.15); z-index: 9999; pointer-events: none; }</style>`
      : "";

    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">${wmCss}</head><body>${html}</body></html>`,
      { waitUntil: "networkidle0" }
    );

    // ✅ Generate PDF buffer
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // ✅ Save PDF temporarily (use os.tmpdir() for cross-platform compatibility)
    const tmpPath = path.join(os.tmpdir(), `${uuidv4()}.pdf`);
    fs.writeFileSync(tmpPath, pdfBuffer);

    const fileName = `${userId}_${Date.now()}.pdf`;
    const storagePath = `pdfs/${userId}/${fileName}`;

    // ✅ Upload to Firebase Storage
    const [uploadResult] = await adminBucket.upload(tmpPath, {
      destination: storagePath,
      metadata: { contentType: "application/pdf" },
    });

    fs.unlinkSync(tmpPath); // cleanup

    // ✅ Generate permanent signed URL (bypasses rules)
    const [signedUrl] = await uploadResult.getSignedUrl({
      action: "read",
      expires: "03-01-2080",
    });

    // ✅ Save metadata in Firestore
    await adminDb
      .collection("soapNotes")
      .doc(userId)
      .collection("notes")
      .add({
        fileName,
        fileUrl: signedUrl,
        createdAt: new Date(),
        noteData,
      });

    console.log("[PDF Render] Signed URL generated:", signedUrl);

    // ✅ Return signed URL to client
    return NextResponse.json({
      success: true,
      url: signedUrl,
      message: "PDF generated and uploaded successfully",
    });
  } catch (e: any) {
    console.error("[PDF Render Error]", e);
    return NextResponse.json(
      { error: e?.message || "Failed to render PDF" },
      { status: 500 }
    );
  }
}
