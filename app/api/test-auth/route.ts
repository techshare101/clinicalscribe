import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Get the user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("🔍 Test Auth API: Auth header received:", authHeader);
    
    if (!authHeader) {
      console.log("❌ Test Auth API: Missing Authorization header");
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ Test Auth API: Invalid auth header format");
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    console.log("🔍 Test Auth API: Token length:", token?.length || 0);
    console.log("🔍 Test Auth API: Token preview:", token?.substring(0, 50) + (token?.length > 50 ? "..." : ""));
    
    // Verify the token using Firebase Admin
    console.log("🔍 Test Auth API: Verifying token...");
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log("✅ Test Auth API: Token verified successfully");
    console.log("✅ Test Auth API: Decoded token UID:", decodedToken.uid);
    
    return NextResponse.json({ 
      success: true, 
      userId: decodedToken.uid,
      token: token.substring(0, 10) + "..." 
    });
  } catch (err: any) {
    console.error("❌ Test Auth API error:", err.message);
    console.error("❌ Test Auth API error code:", err.code);
    console.error("❌ Test Auth API error stack:", err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}