import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check caller role
    const profileSnap = await adminDb.collection("profiles").doc(userId).get();
    const role = profileSnap.exists ? profileSnap.data()?.role : "nurse";
    const isAdmin = role === "system-admin" || role === "nurse-admin";

    // Fetch SOAP notes for the user
    const notesSnapshot = await adminDb
      .collection("soapNotes")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    let notes = notesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });

    // Non-admins only see non-archived notes
    if (!isAdmin) {
      notes = notes.filter((n: any) => !n.archived);
    }

    // Include admin flag so the client knows what controls to show
    return NextResponse.json({ notes, isAdmin });
  } catch (err: any) {
    console.error("SOAP History API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
