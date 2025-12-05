export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Admin endpoint to manually activate a user's beta access
// Use this when webhook fails to deliver
export async function POST(req: NextRequest) {
  try {
    const { email, adminSecret } = await req.json();

    // Simple admin secret check (set ADMIN_SECRET in Vercel env vars)
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (err: any) {
      return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
    }

    const uid = userRecord.uid;

    // Activate beta access
    const activationData = {
      betaActive: true,
      subscriptionStatus: "active",
      activationSource: "admin_manual",
      betaActivatedAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection("profiles").doc(uid).set(activationData, { merge: true });

    console.log(`[Admin] ✅ Manually activated beta for user: ${email} (${uid})`);

    return NextResponse.json({
      success: true,
      message: `Beta access activated for ${email}`,
      uid,
    });
  } catch (error: any) {
    console.error("[Admin] ❌ Activation error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
