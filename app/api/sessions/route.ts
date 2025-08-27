import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Get the user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Verify the token using Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Fetch recent sessions for the user
    const sessionsSnapshot = await adminDb
      .collection("patientSessions")
      .where("patientId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(3)
      .get();
    
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(sessions);
  } catch (err: any) {
    console.error("❌ Sessions API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}