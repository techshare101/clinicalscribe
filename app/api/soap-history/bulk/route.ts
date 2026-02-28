import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

// POST — bulk archive or delete (admin only)
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check caller role from Firestore profiles
    const profileSnap = await adminDb.collection("profiles").doc(userId).get();
    const role = profileSnap.exists ? profileSnap.data()?.role : "nurse";
    const isAdmin = role === "system-admin" || role === "nurse-admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, noteIds } = body;

    if (!action || !["archive", "unarchive", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be: archive, unarchive, or delete" }, { status: 400 });
    }

    // If noteIds provided, operate on those. Otherwise, operate on ALL notes for the user's org.
    let notesToProcess: string[] = [];

    if (noteIds && Array.isArray(noteIds) && noteIds.length > 0) {
      notesToProcess = noteIds;
    } else {
      // Archive/delete all non-archived notes for this user
      const snapshot = await adminDb
        .collection("soapNotes")
        .where("userId", "==", userId)
        .get();
      notesToProcess = snapshot.docs.map(doc => doc.id);
    }

    if (notesToProcess.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Firestore batch writes (max 500 per batch)
    const batches = [];
    for (let i = 0; i < notesToProcess.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = notesToProcess.slice(i, i + 500);

      for (const noteId of chunk) {
        const noteRef = adminDb.collection("soapNotes").doc(noteId);
        if (action === "delete") {
          batch.delete(noteRef);
        } else if (action === "archive") {
          batch.update(noteRef, {
            archived: true,
            archivedAt: FieldValue.serverTimestamp(),
            archivedBy: userId,
          });
        } else if (action === "unarchive") {
          batch.update(noteRef, {
            archived: false,
            archivedAt: FieldValue.delete(),
            archivedBy: FieldValue.delete(),
          });
        }
      }

      batches.push(batch.commit());
    }

    await Promise.all(batches);

    return NextResponse.json({ success: true, action, count: notesToProcess.length });
  } catch (err: any) {
    console.error("Bulk SOAP action error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
