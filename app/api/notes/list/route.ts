import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    // 🔐 Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    console.log(`[Notes List] Fetching notes for user: ${uid}`);

    const snapshot = await adminDb
      .collection("soapNotes")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const notes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        patientName: data.patientName || "Unknown Patient",
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
        filePath: data.filePath, // This should be set when PDF is generated
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        // Include other fields you might need
        patientId: data.patientId,
        encounterType: data.encounterType,
        diagnosis: data.diagnosis,
      };
    });

    console.log(`[Notes List] Found ${notes.length} notes for user ${uid}`);
    return NextResponse.json(notes);
  } catch (err: any) {
    console.error("❌ Error fetching notes:", err.message);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// Alternative version that doesn't require auth header (uses query param for uid)
export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    console.log(`[Notes List] Fetching notes for user: ${uid}`);

    const snapshot = await adminDb
      .collection("soapNotes")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const notes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        patientName: data.patientName || "Unknown Patient",
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
        filePath: data.filePath, // This should be set when PDF is generated
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        // Include other fields you might need
        patientId: data.patientId,
        encounterType: data.encounterType,
        diagnosis: data.diagnosis,
      };
    });

    console.log(`[Notes List] Found ${notes.length} notes for user ${uid}`);
    return NextResponse.json(notes);
  } catch (err: any) {
    console.error("❌ Error fetching notes:", err.message);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}