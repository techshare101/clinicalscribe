import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
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
    
    // Fetch active sessions for the user
    const sessionsSnapshot = await adminDb
      .collection("patientSessions")
      .where("isActive", "==", true)
      .get();
    
    const count = sessionsSnapshot.size;
    
    return NextResponse.json({ count });
  } catch (err: any) {
    console.error("❌ Active Sessions API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
