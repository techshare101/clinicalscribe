import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { headers } from "next/headers";

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, "base64").toString()
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

export async function POST(req: Request) {
  try {
    // TODO: In production, add authentication check here to ensure only admins can access
    // For now, we'll add a simple check using a header or query param
    
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
    }

    console.log(`[Demo Unlock] 🎯 Attempting to unlock beta for uid: ${uid}`);

    // Check if profile exists
    const profileRef = admin.firestore().collection("profiles").doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      console.error(`[Demo Unlock] ❌ Profile not found for uid: ${uid}`);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const currentData = profileDoc.data();
    
    // Update profile with beta access
    await profileRef.update({
      betaActive: true,
      betaActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      activationSource: "demo_unlock",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Demo Unlock] ✅ Beta access unlocked for uid: ${uid}`);
    console.log(`[Demo Unlock] Previous beta status: ${currentData?.betaActive || false}`);

    // Log the action for audit trail
    await admin.firestore().collection("admin_actions").add({
      action: "demo_unlock_beta",
      targetUid: uid,
      targetEmail: currentData?.email || "unknown",
      performedAt: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        previousBetaStatus: currentData?.betaActive || false,
        newBetaStatus: true,
      }
    });

    return NextResponse.json({ 
      ok: true, 
      message: `Beta access unlocked for user ${currentData?.email || uid}`,
      uid,
      email: currentData?.email
    });

  } catch (err: any) {
    console.error("[Demo Unlock] ❌ Error:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to unlock beta access" 
    }, { status: 500 });
  }
}
