import { NextResponse } from "next/server";
import admin from "firebase-admin";

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
    
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
    }

    console.log(`[Clear Beta] 🔒 Attempting to revoke beta for uid: ${uid}`);

    // Check if profile exists
    const profileRef = admin.firestore().collection("profiles").doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      console.error(`[Clear Beta] ❌ Profile not found for uid: ${uid}`);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const currentData = profileDoc.data();
    
    // Update profile to revoke beta access
    await profileRef.update({
      betaActive: false,
      betaRevokedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Clear Beta] ⚡ Beta access revoked for uid: ${uid}`);
    console.log(`[Clear Beta] Previous beta status: ${currentData?.betaActive || false}`);

    // Log the action for audit trail
    await admin.firestore().collection("admin_actions").add({
      action: "clear_beta",
      targetUid: uid,
      targetEmail: currentData?.email || "unknown",
      performedAt: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        previousBetaStatus: currentData?.betaActive || false,
        newBetaStatus: false,
      }
    });

    return NextResponse.json({ 
      ok: true, 
      message: `Beta access revoked for user ${currentData?.email || uid}`,
      uid,
      email: currentData?.email
    });

  } catch (err: any) {
    console.error("[Clear Beta] ❌ Error:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to revoke beta access" 
    }, { status: 500 });
  }
}
