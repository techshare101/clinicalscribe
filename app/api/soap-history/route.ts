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

    // Fetch SOAP notes for the user — query both userId and uid fields
    // SignatureAndPDF saves with "userId", SoapEntry2 historically saved with "uid"
    const [byUserId, byUid] = await Promise.all([
      adminDb.collection("soapNotes").where("userId", "==", userId).orderBy("createdAt", "desc").get(),
      adminDb.collection("soapNotes").where("uid", "==", userId).orderBy("createdAt", "desc").get(),
    ]);

    // Merge and deduplicate by doc ID
    const seen = new Set<string>();
    const allDocs = [...byUserId.docs, ...byUid.docs].filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    let notes = allDocs.map(doc => {
      const data = doc.data();
      // Normalize: SignatureAndPDF saves SOAP under nested `soap` object,
      // while SoapEntry2 saves flat. Flatten nested soap fields to top level.
      const soap = data.soap || {};
      return {
        id: doc.id,
        ...data,
        subjective: data.subjective || soap.subjective || '',
        objective: data.objective || soap.objective || '',
        assessment: data.assessment || soap.assessment || '',
        plan: data.plan || soap.plan || '',
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });

    // Sort merged results by createdAt descending
    notes.sort((a: any, b: any) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
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
