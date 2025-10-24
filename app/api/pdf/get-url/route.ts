import { NextResponse } from "next/server";
import { getSignedPdfUrl } from "@/lib/pdfRetrieval";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    // 🔐 Auth check
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

    // 🔒 Security: Ensure user can only access their own PDFs
    if (!filePath.startsWith(`pdfs/${uid}/`)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log(`[PDF Get URL] Generating permanent download URL for: ${filePath}`);

    // Returns a permanent public URL that never expires
    const url = await getSignedPdfUrl(filePath);
    
    console.log(`[PDF Get URL] Permanent URL generated successfully`);
    return NextResponse.json({ success: true, url });
  } catch (err: any) {
    console.error(`[PDF Get URL] Error:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}