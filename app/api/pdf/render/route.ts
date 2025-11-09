import { NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import admin from "firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Firebase Admin Init ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, "base64").toString())
    ),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}
const bucket = admin.storage().bucket();

// --- Vercel config ---
export const config = {
  maxDuration: 60,
  memory: 1024,
};

// --- Main handler ---
export async function POST(req: Request) {
  let browser;
  try {
    const { html, ownerId, noteId } = await req.json();
    const isLocal = !process.env.VERCEL;

    // 🧠 Launch Chromium
    if (isLocal) {
      // Local dev: use full puppeteer with bundled Chromium
      console.log("[PDF] Launching local Chromium...");
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } else {
      // Vercel: use puppeteer-core + @sparticuz/chromium
      console.log("[PDF] Launching Vercel Chromium...");
      chromium.setHeadlessMode = true;
      chromium.setGraphicsMode = false;
      const executablePath = await chromium.executablePath();
      browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    }

    // 🖨 Generate PDF
    const page = await browser.newPage();
    await page.setContent(html || "<h1>Empty PDF</h1>", { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    // ☁️ Upload to Firebase
    const path = `pdfs/${ownerId}/${noteId}.pdf`;
    const file = bucket.file(path);
    await file.save(pdfBuffer, {
      metadata: { contentType: "application/pdf" },
      resumable: false,
    });
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2035",
    });

    const renderMode = isLocal ? "local-chrome" : "vercel-bundled";
    console.log(`✅ [PDF Render] Success with mode: ${renderMode}`);
    return NextResponse.json({
      status: "ok",
      renderMode,
      pdfUrl: url,
    });
  } catch (err: any) {
    console.error("❌ [PDF Render] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn("[PDF] Browser close warning:", closeErr);
      }
    }
  }
}
