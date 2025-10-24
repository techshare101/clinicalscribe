export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { adminBucket, adminDb } from "@/lib/firebase-admin";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { html, userId, noteData, watermark } = await req.json();

    if (!html || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Launch Puppeteer using sparticuz chromium (serverless safe)
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
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

    // ✅ Save PDF temporarily
    const tmpPath = path.join("/tmp", `${uuidv4()}.pdf`);
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
