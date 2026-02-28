import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const caller = await adminAuth.verifyIdToken(token);

    // Only system-admin can remove users
    const callerProfile = await adminDb.collection("profiles").doc(caller.uid).get();
    const callerRole = callerProfile.get("role") || "nurse";
    if (callerRole !== "system-admin") {
      return NextResponse.json(
        { error: "Only system administrators can remove users" },
        { status: 403 }
      );
    }

    const { uid } = await req.json();
    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent self-deletion
    if (uid === caller.uid) {
      return NextResponse.json(
        { error: "You cannot remove your own account" },
        { status: 400 }
      );
    }

    // Get the target user's profile before deletion for audit log
    const targetProfile = await adminDb.collection("profiles").doc(uid).get();
    const targetEmail = targetProfile.get("email") || "";
    const targetRole = targetProfile.get("role") || "nurse";

    // Prevent removing another system-admin
    if (targetRole === "system-admin") {
      return NextResponse.json(
        { error: "Cannot remove another system administrator. Demote them first." },
        { status: 400 }
      );
    }

    // 1. Delete the Firestore profile
    if (targetProfile.exists) {
      await adminDb.collection("profiles").doc(uid).delete();
    }

    // 2. Delete any SOAP notes owned by this user
    const soapSnap = await adminDb
      .collection("soap_notes")
      .where("uid", "==", uid)
      .get();
    const batch1 = adminDb.batch();
    soapSnap.docs.forEach((doc) => batch1.delete(doc.ref));
    if (!soapSnap.empty) {
      await batch1.commit();
    }

    // 3. Delete the Firebase Auth account
    try {
      await adminAuth.deleteUser(uid);
    } catch (authErr: any) {
      // User might not exist in Auth (e.g., already deleted)
      if (authErr.code !== "auth/user-not-found") {
        console.error("Error deleting auth user:", authErr);
      }
    }

    // 4. Audit log
    await adminDb.collection("audit_logs").add({
      action: "user_removed",
      performedBy: caller.uid,
      performedByEmail: caller.email || "",
      targetUid: uid,
      targetEmail,
      targetRole,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      message: `User ${targetEmail || uid} has been removed`,
    });
  } catch (err: any) {
    console.error("Error removing user:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
