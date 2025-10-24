import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
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

    const { uid, active } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 });
    }

    // Update the profile
    await adminDb.collection("profiles").doc(uid).set(
      {
        betaActive: active,
        subscriptionStatus: active ? "active" : "inactive",
        stripeSubscriptionStatus: active ? "active" : "canceled",
        updatedAt: FieldValue.serverTimestamp(),
        // Keep the activationSource to maintain it as a demo account
        ...(active && { activationSource: "seed-demo-api" }),
      },
      { merge: true }
    );

    return NextResponse.json({ 
      ok: true,
      uid,
      betaActive: active,
      message: `Demo account ${active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (e) {
    console.error("Toggle demo error", e);
    return NextResponse.json({ error: "Failed to toggle demo status" }, { status: 500 });
  }
}
