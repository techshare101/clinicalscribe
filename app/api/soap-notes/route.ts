import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Get the user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("🔍 SOAP Notes API: Auth header received:", authHeader ? "Present" : "Missing");
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ SOAP Notes API: Invalid auth header format");
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    console.log("🔍 SOAP Notes API: Token length:", token?.length || 0);
    
    // Verify the token using Firebase Admin
    console.log("🔍 SOAP Notes API: Verifying token...");
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log("✅ SOAP Notes API: Token verified for user:", userId);
    
    // Fetch recent SOAP notes for the user
    const notesSnapshot = await adminDb
      .collection("soapNotes")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(3)
      .get();
    
    const notes = notesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(notes);
  } catch (err: any) {
    console.error("❌ SOAP Notes API error:", err.message);
    console.error("❌ SOAP Notes API error code:", err.code);
    console.error("❌ SOAP Notes API error stack:", err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}