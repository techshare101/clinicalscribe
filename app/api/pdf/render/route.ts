import { NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";
import admin from "firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const config = {
  maxDuration: 60,
  memory: 1024,
};

// 🧠 Lazy Firebase Admin initialization (runtime only)
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env var");
      throw new Error("Missing Firebase service account");
    }

    const decoded = JSON.parse(
      Buffer.from(serviceAccountBase64, "base64").toString()
    );

    admin.initializeApp({
      credential: admin.credential.cert(decoded),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log("🔥 Firebase Admin initialized at runtime");
  }
  return admin;
}

// --- Helper to get Firestore server timestamp safely ---
function getServerTimestamp() {
  const adminApp = getFirebaseAdmin();
  return adminApp.firestore.FieldValue.serverTimestamp();
}

// 🧑 Main route
export async function POST(req: Request) {
  let browser;
  try {
    const { html, ownerId, noteId } = await req.json();
    const isLocal = !process.env.VERCEL;
    console.log(`[PDF Render] Starting in ${isLocal ? "local" : "vercel"} mode...`);

    // 🚀 Launch correct Chromium flavor
    if (isLocal) {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } else {
      // Vercel: use @sparticuz/chromium v141+ with dynamic import
      const chromium = await import("@sparticuz/chromium");
      const executablePath = await chromium.default.executablePath();
      
      browser = await puppeteerCore.launch({
        args: chromium.default.args,
        executablePath,
        headless: true,
      });
    }

    // 🖨 Generate PDF
    const page = await browser.newPage();
    await page.setContent(html || "<h1>Empty PDF</h1>", {
      waitUntil: "networkidle0",
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    if (!pdfBuffer?.length) {
      throw new Error("Generated PDF is empty");
    }

    // ☁️ Upload to Firebase
    const adminApp = getFirebaseAdmin();
    const bucket = adminApp.storage().bucket();
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

    // 💾 Firestore update
    const db = adminApp.firestore();
    const renderMode = isLocal ? "local-chrome" : "vercel-bundled";

    await db.collection("soapNotes").doc(noteId).set(
      {
        userId: ownerId,
        noteId,
        pdfUrl: url,
        storagePath: path,
        renderMode,
        status: "done",
        updatedAt: getServerTimestamp(),
      },
      { merge: true }
    );

    console.log(`[PDF Render] ✅ Success with mode: ${renderMode}`);
    
    // Return raw PDF binary for immediate download
    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="clinicalscribe-${noteId}.pdf"`,
        "Cache-Control": "no-store",
        "X-PDF-URL": url, // Include Firebase URL in header for reference
        "X-Render-Mode": renderMode,
      },
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
