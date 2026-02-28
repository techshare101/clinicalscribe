import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header", status: 401 };
  }

  const token = authHeader.split(" ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  const userId = decodedToken.uid;

  // Check caller role from Firestore profiles
  const profileSnap = await adminDb.collection("profiles").doc(userId).get();
  const role = profileSnap.exists ? profileSnap.data()?.role : "nurse";
  const isAdmin = role === "system-admin" || role === "nurse-admin";

  if (!isAdmin) {
    return { error: "Forbidden: admin access required", status: 403 };
  }

  return { userId, role };
}

// PATCH — soft-delete (archive/unarchive)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdmin(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const archived = body.archived !== undefined ? Boolean(body.archived) : true;

    const noteRef = adminDb.collection("soapNotes").doc(id);
    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await noteRef.update({
      archived,
      archivedAt: archived ? FieldValue.serverTimestamp() : FieldValue.delete(),
      archivedBy: archived ? auth.userId : FieldValue.delete(),
    });

    return NextResponse.json({ success: true, archived });
  } catch (err: any) {
    console.error("Archive SOAP note error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — permanent hard-delete (admin only)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdmin(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const noteRef = adminDb.collection("soapNotes").doc(id);
    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await noteRef.delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete SOAP note error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
