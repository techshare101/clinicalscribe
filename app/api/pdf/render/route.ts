import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";
import fullPuppeteer from "puppeteer";
import { adminAuth, adminBucket, adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import fs from "fs";

export const runtime = "nodejs";

type PdfRequestPayload = {
  html?: string;
  ownerId?: string;
  userId?: string;
  uid?: string;
  noteId?: string;
  patientId?: string;
  patientName?: string;
  docLang?: string;
  watermark?: string;
  signature?: string;
};

const LOCAL_CHROME_PATHS = [
  process.env.LOCAL_CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean) as string[];

const ADMIN_ROLES = new Set(["system-admin", "nurse-admin"]);

function pickLocalChromeExecutable(): string | null {
  for (const candidate of LOCAL_CHROME_PATHS) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function launchBrowser(isLocal: boolean) {
  if (isLocal) {
    const executablePath = pickLocalChromeExecutable();
    if (!executablePath) {
      throw new Error(
        "Local Chrome executable not found. Install Google Chrome or set LOCAL_CHROME_PATH."
      );
    }
    return fullPuppeteer.launch({
      headless: true,
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  // Vercel serverless environment
  // Load fonts for proper PDF rendering
  await chromium.font(
    "https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf"
  );

  const executablePath = await chromium.executablePath();
  
  return puppeteerCore.launch({
    args: [
      ...chromium.args,
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: true,
  });
}

function buildHtmlTemplate(html: string, watermarkText: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 1in; }
      body { font-family: Arial, sans-serif; position: relative; }
      .watermark {
        position: fixed;
        top: 40%;
        left: 10%;
        width: 80%;
        font-size: 60px;
        color: rgba(200,200,200,0.15);
        text-align: center;
        transform: rotate(-30deg);
        pointer-events: none;
      }
      footer {
        position: fixed;
        bottom: 1in;
        left: 0;
        width: 100%;
        text-align: center;
        font-size: 12px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="watermark">${watermarkText}</div>
    ${html}
    <footer>Signed by Nurse __________ - ${new Date().toLocaleString()}</footer>
  </body>
</html>`;
}

function coerceOwnerId(
  payload: PdfRequestPayload,
  decoded: admin.auth.DecodedIdToken | null
) {
  const requestedOwner =
    payload.ownerId ?? payload.userId ?? payload.uid ?? undefined;

  if (!decoded) {
    if (!requestedOwner) {
      throw new Error(
        "Missing ownerId. Provide ownerId or include a Firebase ID token."
      );
    }
    return { ownerId: requestedOwner, uid: requestedOwner };
  }

  const uid = decoded.uid;
  const role = (decoded as any)?.role;
  const isAdmin = role ? ADMIN_ROLES.has(role) : false;

  if (requestedOwner && requestedOwner !== uid && !isAdmin) {
    throw new Error("Forbidden: cannot render PDF for another user");
  }

  return { ownerId: requestedOwner ?? uid, uid };
}

export async function POST(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let payload: PdfRequestPayload = {};
    let htmlInput: string | undefined;

    if (contentType.includes("application/json")) {
      payload = (await req.json()) as PdfRequestPayload;
      htmlInput = payload.html;
    } else {
      const textBody = await req.text();
      const trimmed = textBody.trim();

      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          payload = JSON.parse(textBody) as PdfRequestPayload;
          htmlInput = payload.html;
        } catch {
          htmlInput = textBody;
        }
      } else {
        htmlInput = textBody;
      }
    }

    if (!htmlInput || typeof htmlInput !== "string" || !htmlInput.trim()) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
    const decoded = token ? await adminAuth.verifyIdToken(token) : null;

    const { ownerId, uid } = coerceOwnerId(payload, decoded);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Unable to resolve ownerId for PDF storage" },
        { status: 400 }
      );
    }

    console.log("[PDF Render] Starting for ownerId:", ownerId);
    const isLocal = !process.env.VERCEL;
    console.log("[PDF Render] Running in:", isLocal ? "Local" : "Vercel");
    
    if (!isLocal) {
      const execPath = await chromium.executablePath();
      console.log("[PDF Render] Executable path:", execPath);
    }
    
    browser = await launchBrowser(isLocal);
    console.log("[PDF Render] Browser launched successfully");

    const page = await browser.newPage();
    const watermarkText = payload.watermark ?? "ClinicalScribe Beta";
    const htmlWithChrome = buildHtmlTemplate(htmlInput, watermarkText);
    await page.setContent(htmlWithChrome, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const rawNoteId =
      (payload.noteId && payload.noteId.trim()) || `${ownerId}_${Date.now()}`;
    const safeNoteId = rawNoteId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `pdfs/${ownerId}/${safeNoteId}.pdf`;

    const file = adminBucket.file(storagePath);
    await file.save(pdfBuffer, {
      resumable: false,
      contentType: "application/pdf",
      metadata: {
        metadata: {
          ownerId,
          generatedBy: uid,
          noteId: safeNoteId,
        },
      },
    });

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2080",
    });

    const noteRef = adminDb.collection("soapNotes").doc(safeNoteId);
    const noteSnap = await noteRef.get();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const firestoreUpdate: Record<string, unknown> = {
      userId: ownerId,
      uid: ownerId,
      noteId: safeNoteId,
      pdfUrl: signedUrl,
      storagePath,
      pdf: {
        status: "done",
        path: storagePath,
        url: signedUrl,
      },
      updatedAt: now,
    };

    if (payload.patientId) firestoreUpdate.patientId = payload.patientId;
    if (payload.patientName) firestoreUpdate.patientName = payload.patientName;
    if (payload.docLang) firestoreUpdate.docLang = payload.docLang;
    if (payload.signature) firestoreUpdate.signature = payload.signature;

    if (!noteSnap.exists) {
      firestoreUpdate.createdAt = now;
    }

    await noteRef.set(firestoreUpdate, { merge: true });
    console.log("[PDF Render] Firestore updated successfully for noteId:", safeNoteId);
    console.log("[PDF Render] PDF URL:", signedUrl);

    // Return the PDF blob directly for immediate download
    // Metadata is stored in custom headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeNoteId}.pdf"`,
        "X-PDF-URL": signedUrl,
        "X-PDF-Path": storagePath,
        "X-Note-ID": safeNoteId,
        "X-PDF-Size": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("[PDF Render] Error generating PDF", error);
    const message =
      error?.message || "Unexpected error while generating PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("[PDF Render] Error closing browser", closeError);
      }
    }
  }
}
