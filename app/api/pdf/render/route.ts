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

type RenderMode = "local-chrome" | "vercel-bundled" | "remote-render";
type BrowserLaunchResult = {
  browser: any; // Union type to support both puppeteer and puppeteer-core
  renderMode: Exclude<RenderMode, "remote-render">;
};

function pickLocalChromeExecutable(): string | null {
  for (const candidate of LOCAL_CHROME_PATHS) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function launchBrowser(isLocal: boolean): Promise<BrowserLaunchResult> {
  if (isLocal) {
    const executablePath = pickLocalChromeExecutable();
    if (!executablePath) {
      throw new Error(
        "Local Chrome executable not found. Install Google Chrome or set LOCAL_CHROME_PATH."
      );
    }
    const browser = await fullPuppeteer.launch({
      headless: true,
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    return { browser, renderMode: "local-chrome" };
  }

  // Vercel serverless environment - optimized for Lambda
  console.log("[PDF Render] Launching Chromium for Vercel serverless...");
  
  // Load fonts for proper PDF rendering (optional, can skip if causing issues)
  try {
    await chromium.font(
      "https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf"
    );
  } catch (fontError) {
    console.warn("[PDF Render] Font loading failed, continuing without custom fonts:", fontError);
  }

  const executablePath = await chromium.executablePath();
  console.log("[PDF Render] Chromium executable path:", executablePath);
  
  if (!executablePath) {
    throw new Error("Chromium executable path could not be resolved.");
  }

  const browser = await puppeteerCore.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  });
  
  console.log("[PDF Render] Chromium launched successfully");
  return { browser, renderMode: "vercel-bundled" };
}

async function renderPdfWithLocalEngines(
  html: string,
  isLocal: boolean
): Promise<{ pdfBuffer: Buffer; renderMode: RenderMode }> {
  let launchResult: BrowserLaunchResult | null = null;
  try {
    launchResult = await launchBrowser(isLocal);
    console.log(
      "[PDF Render] Browser launched successfully using mode:",
      launchResult.renderMode
    );

    const page = await launchResult.browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return { pdfBuffer, renderMode: launchResult.renderMode };
  } finally {
    if (launchResult?.browser) {
      try {
        await launchResult.browser.close();
      } catch (error) {
        console.error("[PDF Render] Error closing browser", error);
      }
    }
  }
}

async function renderPdfViaRemote(html: string): Promise<Buffer> {
  const fallbackUrl = process.env.RENDER_PDF_URL;
  if (!fallbackUrl) {
    throw new Error(
      "RENDER_PDF_URL is not configured; remote PDF rendering is unavailable."
    );
  }

  const response = await fetch(fallbackUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(
      `Remote render service responded with ${response.status} ${
        response.statusText
      }${bodyText ? `: ${bodyText}` : ""}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log("[PDF Render] Remote render fallback succeeded");
  return Buffer.from(arrayBuffer);
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

    const watermarkText = payload.watermark ?? "ClinicalScribe Beta";
    const htmlWithChrome = buildHtmlTemplate(htmlInput, watermarkText);

    let pdfBuffer: Buffer | undefined;
    let renderMode: RenderMode | null = null;

    try {
      console.log("[PDF Render] Attempting PDF generation with local engines...");
      const localResult = await renderPdfWithLocalEngines(
        htmlWithChrome,
        isLocal
      );
      pdfBuffer = localResult.pdfBuffer;
      renderMode = localResult.renderMode;
      console.log(`[PDF Render] ✅ Success with mode: ${renderMode}`);
    } catch (localError) {
      console.error(
        "[PDF Render] ❌ Local rendering failed:",
        localError instanceof Error ? localError.message : localError
      );
      console.error("[PDF Render] Full error stack:", localError);

      if (!process.env.RENDER_PDF_URL) {
        console.error("[PDF Render] No RENDER_PDF_URL configured for fallback");
        throw localError instanceof Error
          ? localError
          : new Error(
              "Local PDF generation failed and RENDER_PDF_URL is not configured."
            );
      }

      try {
        console.log(
          "[PDF Render] 🔄 Attempting remote render fallback via RENDER_PDF_URL:",
          process.env.RENDER_PDF_URL
        );
        pdfBuffer = await renderPdfViaRemote(htmlWithChrome);
        renderMode = "remote-render";
        console.log("[PDF Render] ✅ Remote render succeeded");
      } catch (remoteError) {
        console.error("[PDF Render] ❌ Remote render fallback failed:", remoteError);
        throw new Error("All PDF render strategies failed.");
      }
    }

    if (!pdfBuffer || !renderMode) {
      throw new Error("Failed to produce PDF.");
    }

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
      renderMode,
      pdf: {
        status: "done",
        path: storagePath,
        url: signedUrl,
        renderMode,
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
    console.log(
      "[PDF Render] Firestore updated successfully for noteId:",
      safeNoteId
    );
    console.log("[PDF Render] PDF URL:", signedUrl);
    console.log("[PDF Render] Completed using mode:", renderMode);

    // Save to soapHistory collection for live panel updates
    try {
      const historyRef = adminDb.collection("soapHistory").doc();
      await historyRef.set({
        ownerId,
        userId: ownerId,
        noteId: safeNoteId,
        pdfUrl: signedUrl,
        storagePath,
        renderMode,
        patientId: payload.patientId || null,
        patientName: payload.patientName || null,
        createdAt: now,
      });
      console.log("[PDF Render] Added to soapHistory collection");
    } catch (historyError) {
      console.error("[PDF Render] Failed to save to soapHistory:", historyError);
      // Don't fail the entire request if history save fails
    }

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
        "X-Render-Mode": renderMode,
      },
    });
  } catch (error: any) {
    console.error("[PDF Render] Error generating PDF", error);
    const message =
      error?.message || "Unexpected error while generating PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
