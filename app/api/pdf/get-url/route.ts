import { NextResponse } from "next/server";
import { adminAuth, adminBucket } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }

    // Security: Ensure user can only access their own PDFs
    if (!filePath.startsWith(`pdfs/${uid}/`)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const file = adminBucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      return NextResponse.json({ error: "PDF file not found in storage" }, { status: 404 });
    }

    // Generate fresh signed URL — long expiry, bypasses storage rules
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2080",
    });

    return NextResponse.json({ success: true, url: signedUrl });
  } catch (err: any) {
    console.error("[PDF Get URL] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
