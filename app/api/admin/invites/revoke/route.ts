import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

// POST — revoke an invite or remove a member from the organization
export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await adminDb.collection("profiles").doc(decoded.uid).get();
    const orgId = profile.get("orgId");
    const callerRole = profile.get("role") || "nurse";

    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    if (!["nurse-admin", "system-admin"].includes(callerRole)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { inviteId, memberUid } = await req.json();

    // Revoke a pending invite
    if (inviteId) {
      const inviteSnap = await adminDb.collection("invites").doc(inviteId).get();
      if (!inviteSnap.exists) {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
      }

      const inviteData = inviteSnap.data()!;
      if (inviteData.orgId !== orgId) {
        return NextResponse.json({ error: "Invite does not belong to your organization" }, { status: 403 });
      }

      if (inviteData.status !== "pending") {
        return NextResponse.json({ error: "Invite is no longer pending" }, { status: 400 });
      }

      await adminDb.collection("invites").doc(inviteId).update({
        status: "revoked",
        revokedBy: decoded.uid,
        revokedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ ok: true, action: "invite_revoked", inviteId });
    }

    // Remove a member from the organization
    if (memberUid) {
      if (memberUid === decoded.uid) {
        return NextResponse.json(
          { error: "Cannot remove yourself. Transfer admin role first." },
          { status: 400 }
        );
      }

      const memberProfile = await adminDb.collection("profiles").doc(memberUid).get();
      if (!memberProfile.exists || memberProfile.get("orgId") !== orgId) {
        return NextResponse.json({ error: "Member not found in your organization" }, { status: 404 });
      }

      // Remove org association from the member's profile
      await adminDb.collection("profiles").doc(memberUid).update({
        orgId: FieldValue.delete(),
        orgRole: FieldValue.delete(),
        betaActive: false,
        removedFromOrgAt: FieldValue.serverTimestamp(),
        removedBy: decoded.uid,
      });

      // Log the action
      await adminDb.collection("audit_logs").add({
        action: "member_removed",
        performedBy: decoded.uid,
        performedByEmail: decoded.email || "",
        targetUid: memberUid,
        orgId,
        timestamp: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ ok: true, action: "member_removed", memberUid });
    }

    return NextResponse.json(
      { error: "Either inviteId or memberUid is required" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Error revoking invite/member:", err);
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
