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
    
    // Fetch SOAP notes for the user
    const notesSnapshot = await adminDb
      .collection("soapNotes")
      .where("uid", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    
    const notes = notesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(notes);
  } catch (err: any) {
    console.error("❌ SOAP History API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}