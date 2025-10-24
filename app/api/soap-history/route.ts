import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Get the user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("🔍 SOAP History API: Auth header received:", authHeader ? "Present" : "Missing");
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ SOAP History API: Invalid auth header format");
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    console.log("🔍 SOAP History API: Token length:", token?.length || 0);
    
    // Verify the token using Firebase Admin
    console.log("🔍 SOAP History API: Verifying token...");
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log("✅ SOAP History API: Token verified for user:", userId);
    
    console.log('Fetching SOAP notes for user:', userId); // Debug log
    
    // Fetch SOAP notes for the user
    const notesSnapshot = await adminDb
      .collection("soapNotes")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    
    const notes = notesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to ISO string for consistent serialization
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });
    
    console.log('Found SOAP notes:', notes.length); // Debug log
    
    return NextResponse.json(notes);
  } catch (err: any) {
    console.error("❌ SOAP History API error:", err.message);
    console.error("❌ SOAP History API error code:", err.code);
    console.error("❌ SOAP History API error stack:", err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
