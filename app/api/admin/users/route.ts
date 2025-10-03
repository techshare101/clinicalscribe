import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // Get the auth token from the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user has admin access (nurse-admin or system-admin)
    const callerProfile = await adminDb.collection("profiles").doc(decodedToken.uid).get();
    const callerRole = callerProfile.get("role") || "nurse";
    
    if (!["nurse-admin", "system-admin"].includes(callerRole)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Fetch all users with pagination
    const limit = 50; // Adjust as needed
    const snapshot = await adminDb.collection("profiles").limit(limit).get();
    
    // Get auth data for each user to include email
    const users = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const uid = doc.id;
        
        // Try to get email from Auth if not in profile
        let email = data.email;
        let displayName = data.displayName;
        
        if (!email) {
          try {
            const authUser = await adminAuth.getUser(uid);
            email = authUser.email || "";
            displayName = displayName || authUser.displayName;
          } catch (e) {
            // User might be deleted from Auth
            email = "Unknown";
          }
        }
        
        return {
          uid,
          email,
          displayName,
          role: data.role || "nurse",
          betaActive: data.betaActive || false,
          subscriptionStatus: data.subscriptionStatus,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          roleUpdatedAt: data.roleUpdatedAt,
        };
      })
    );

    // Sort by role importance, then by email
    const roleOrder = { "system-admin": 0, "nurse-admin": 1, "nurse": 2 };
    users.sort((a, b) => {
      const roleCompare = (roleOrder[a.role] || 999) - (roleOrder[b.role] || 999);
      if (roleCompare !== 0) return roleCompare;
      return (a.email || "").localeCompare(b.email || "");
    });

    return NextResponse.json({ 
      users,
      total: users.length,
      callerRole // So frontend knows if they can edit
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}