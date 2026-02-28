import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    // Verify the note belongs to the user
    const noteRef = adminDb.collection("soapNotes").doc(id);
    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const noteData = noteDoc.data();
    if (noteData?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await noteRef.delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete SOAP note error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
