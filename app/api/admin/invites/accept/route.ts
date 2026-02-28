import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

// POST — accept an invite (called after signup with invite token)
export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteToken } = await req.json();
    if (!inviteToken) {
      return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
    }

    // Find the invite by token
    const inviteSnap = await adminDb
      .collection("invites")
      .where("inviteToken", "==", inviteToken)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 404 }
      );
    }

    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data();

    // Check expiry
    const expiresAt = invite.expiresAt?.toDate?.() || invite.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      await inviteDoc.ref.update({ status: "expired" });
      return NextResponse.json(
        { error: "This invite has expired. Please ask your admin for a new one." },
        { status: 410 }
      );
    }

    // Verify email matches (case-insensitive)
    const userEmail = (decoded.email || "").toLowerCase().trim();
    const inviteEmail = (invite.email || "").toLowerCase().trim();

    if (userEmail !== inviteEmail) {
      return NextResponse.json(
        {
          error: `This invite was sent to ${inviteEmail}. Please sign up with that email address.`,
          expectedEmail: inviteEmail,
        },
        { status: 403 }
      );
    }

    // Accept the invite — update profile and invite doc
    const batch = adminDb.batch();

    // Update the user's profile with org info
    batch.set(
      adminDb.collection("profiles").doc(decoded.uid),
      {
        orgId: invite.orgId,
        orgRole: "member",
        role: invite.role || "nurse",
        email: userEmail,
        betaActive: true, // Org members get Pro access
        inviteAcceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Mark invite as accepted
    batch.update(inviteDoc.ref, {
      status: "accepted",
      acceptedBy: decoded.uid,
      acceptedAt: FieldValue.serverTimestamp(),
    });

    // Audit log
    const auditRef = adminDb.collection("audit_logs").doc();
    batch.set(auditRef, {
      action: "invite_accepted",
      performedBy: decoded.uid,
      performedByEmail: userEmail,
      orgId: invite.orgId,
      inviteId: inviteDoc.id,
      role: invite.role,
      timestamp: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      ok: true,
      orgId: invite.orgId,
      orgName: invite.orgName,
      role: invite.role,
      message: `Welcome to ${invite.orgName}! You've been added as a ${invite.role}.`,
    });
  } catch (err: any) {
    console.error("Error accepting invite:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- Helpers ---
async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split("Bearer ")[1];
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}
