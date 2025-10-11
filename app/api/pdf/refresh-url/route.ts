export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminBucket, adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // 🔐 Authenticate user from token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    console.log(`[PDF Refresh] Authenticated user: ${userId}`);

    // Get request body
    const { noteId, filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }

    console.log(`[PDF Refresh] Regenerating signed URL for: ${filePath}`);

    // Check if file exists
    const file = adminBucket.file(filePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      return NextResponse.json({ error: "PDF file not found" }, { status: 404 });
    }

    // 🔗 Generate new signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2080", // Long-lived signed URL
    });

    console.log("[PDF Refresh] New signed URL generated successfully");

    // 🧾 Update PDF metadata in Firestore if noteId provided
    if (noteId) {
      try {
        await adminDb.collection("soapNotes").doc(noteId).update({
          pdfUrl: signedUrl,
          urlRefreshedAt: new Date().toISOString(),
        });
        
        console.log("✅ PDF URL updated in Firestore:", noteId);
      } catch (firestoreError: any) {
        console.error("❌ Failed to update PDF URL in Firestore:", firestoreError);
        // Don't fail the entire request if Firestore update fails
      }
    }

    return NextResponse.json({
      success: true,
      url: signedUrl,
      filePath: filePath,
      message: "Signed URL refreshed successfully",
    });

  } catch (e: any) {
    console.error("[PDF Refresh Error]", e);
    return NextResponse.json(
      { error: e?.message || "Failed to refresh PDF URL" },
      { status: 500 }
    );
  }
}