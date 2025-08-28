import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs"; // ✅ make sure this runs in Node.js, not Edge

export async function GET() {
  try {
    // Count sessions
    const sessionsSnap = await adminDb.collection("patientSessions").get();
    const sessionsCount = sessionsSnap.size;

    // Count SOAP notes
    const notesSnap = await adminDb.collection("soapNotes").get();
    const notesCount = notesSnap.size;

    // Count recordings (optional: nested structure)
    const recordingsSnap = await adminDb.collectionGroup("recordings").get();
    const recordingsCount = recordingsSnap.size;

    // Return stats JSON
    return NextResponse.json({
      sessions: sessionsCount,
      notes: notesCount,
      recordings: recordingsCount,
    });
  } catch (err: any) {
    console.error("❌ Stats API error:", err.message);
    // Return a more user-friendly error message
    return NextResponse.json(
      { 
        error: "Failed to load stats", 
        message: "Unable to connect to the database. Please check server logs for details."
      }, 
      { status: 500 }
    );
  }
}