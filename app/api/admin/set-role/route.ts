import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const VALID_ROLES = ["nurse", "nurse-admin", "system-admin"];

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

    // Only system admins can change roles
    const callerProfile = await adminDb.collection("profiles").doc(decodedToken.uid).get();
    const callerRole = callerProfile.get("role") || "nurse";
    
    if (callerRole !== "system-admin") {
      return NextResponse.json({ 
        error: "Only system administrators can change user roles" 
      }, { status: 403 });
    }

    // Parse request body
    const { uid, role } = await req.json();
    
    if (!uid || !role) {
      return NextResponse.json({ error: "UID and role are required" }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` 
      }, { status: 400 });
    }

    // Prevent self-demotion for safety
    if (uid === decodedToken.uid && role !== "system-admin") {
      return NextResponse.json({ 
        error: "Cannot demote your own account. Ask another system admin." 
      }, { status: 400 });
    }

    // Get the target user's current data
    const targetProfile = await adminDb.collection("profiles").doc(uid).get();
    const currentRole = targetProfile.get("role") || "nurse";

    // Update the user's role
    await adminDb.collection("profiles").doc(uid).set(
      {
        role,
        previousRole: currentRole,
        roleUpdatedAt: FieldValue.serverTimestamp(),
        roleUpdatedBy: decodedToken.uid,
        roleUpdatedByEmail: decodedToken.email || "Unknown",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Log the role change for audit trail
    await adminDb.collection("audit_logs").add({
      action: "role_change",
      performedBy: decodedToken.uid,
      performedByEmail: decodedToken.email || "Unknown",
      targetUid: uid,
      previousRole: currentRole,
      newRole: role,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      ok: true,
      uid,
      role,
      previousRole: currentRole,
      message: `Successfully updated role from ${currentRole} to ${role}`
    });
  } catch (err) {
    console.error("Error updating role:", err);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
