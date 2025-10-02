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

    // TODO: Add admin role check here
    // For now, we'll just check if the user is authenticated
    // In production, you should verify the user has admin privileges
    
    // Fetch all profiles with activationSource = "seed-demo-api" or "seed-script"
    const snapshot = await adminDb
      .collection("profiles")
      .where("activationSource", "in", ["seed-demo-api", "seed-script"])
      .get();

    // Get user emails from Auth
    const accounts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const uid = doc.id;
        
        // Try to get user record from Auth to get email
        let email = data.email || "Unknown";
        let displayName = data.displayName;
        
        try {
          const userRecord = await adminAuth.getUser(uid);
          email = userRecord.email || email;
          displayName = userRecord.displayName || displayName;
        } catch (e) {
          console.warn(`Could not fetch auth user for ${uid}`);
        }
        
        return {
          uid,
          email,
          displayName,
          betaActive: data.betaActive || false,
          activationSource: data.activationSource,
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          subscriptionStatus: data.subscriptionStatus,
        };
      })
    );

    return NextResponse.json({ accounts });
  } catch (e) {
    console.error("Error fetching demo accounts", e);
    return NextResponse.json({ error: "Failed to fetch demo accounts" }, { status: 500 });
  }
}