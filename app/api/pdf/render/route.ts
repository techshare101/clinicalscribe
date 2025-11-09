import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import admin from "firebase-admin";

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
  try {
    const { html, ownerId, noteId } = await req.json();

    // 🧠 Launch Chromium
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    // 🖨 Generate PDF
    const page = await browser.newPage();
    await page.setContent(html || "<h1>Empty PDF</h1>", { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

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

    console.log("✅ [PDF Render] Success with mode: vercel-bundled");
    return NextResponse.json({
      status: "ok",
      renderMode: "vercel-bundled",
      pdfUrl: url,
    });
  } catch (err: any) {
    console.error("❌ [PDF Render] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
