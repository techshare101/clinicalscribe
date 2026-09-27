import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export const runtime = "nodejs";

const VALID_ROLES = ["nurse", "nurse-admin"];

// GET — list invites for caller's organization
export async function GET(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return unauthorized();

    const profile = await adminDb.collection("profiles").doc(decoded.uid).get();
    const orgId = profile.get("orgId");
    if (!orgId) {
      return NextResponse.json({ invites: [], error: "No organization found" });
    }

    const callerRole = profile.get("role") || "nurse";
    if (!["nurse-admin", "system-admin"].includes(callerRole)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection("invites")
      .where("orgId", "==", orgId)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const invites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      acceptedAt: doc.data().acceptedAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ invites });
  } catch (err: any) {
    console.error("Error fetching invites:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — send a new invite
export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return unauthorized();

    const profile = await adminDb.collection("profiles").doc(decoded.uid).get();
    const orgId = profile.get("orgId");
    const callerRole = profile.get("role") || "nurse";

    if (!orgId) {
      return NextResponse.json(
        { error: "You must create an organization first" },
        { status: 400 }
      );
    }

    if (!["nurse-admin", "system-admin"].includes(callerRole)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { email, role } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const assignRole = role && VALID_ROLES.includes(role) ? role : "nurse";

    // Check seat limit
    const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
    if (!orgSnap.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    const orgData = orgSnap.data()!;
    const seatLimit = orgData.seats || 10;

    const membersSnap = await adminDb
      .collection("profiles")
      .where("orgId", "==", orgId)
      .get();

    const pendingSnap = await adminDb
      .collection("invites")
      .where("orgId", "==", orgId)
      .where("status", "==", "pending")
      .get();

    const usedSeats = membersSnap.size + pendingSnap.size;
    if (usedSeats >= seatLimit) {
      return NextResponse.json(
        {
          error: `Seat limit reached (${seatLimit}). Upgrade your plan or remove members.`,
          usedSeats,
          seatLimit,
        },
        { status: 400 }
      );
    }

    // Check for duplicate pending invite
    const existingInvite = await adminDb
      .collection("invites")
      .where("orgId", "==", orgId)
      .where("email", "==", email.toLowerCase().trim())
      .where("status", "==", "pending")
      .get();

    if (!existingInvite.empty) {
      return NextResponse.json(
        { error: "An invite is already pending for this email" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await adminDb
      .collection("profiles")
      .where("orgId", "==", orgId)
      .where("email", "==", email.toLowerCase().trim())
      .get();

    if (!existingMember.empty) {
      return NextResponse.json(
        { error: "This user is already a member of your organization" },
        { status: 400 }
      );
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");

    const inviteData = {
      orgId,
      orgName: orgData.name || "Unknown",
      email: email.toLowerCase().trim(),
      role: assignRole,
      status: "pending" as const,
      inviteToken,
      invitedBy: decoded.uid,
      invitedByEmail: decoded.email || "",
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    const inviteRef = await adminDb.collection("invites").add(inviteData);

    // Build the invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://clinicalscribe.vercel.app";
    const inviteLink = `${baseUrl}/auth/signup?invite=${inviteToken}`;

    return NextResponse.json({
      ok: true,
      invite: {
        id: inviteRef.id,
        email: inviteData.email,
        role: inviteData.role,
        inviteLink,
        expiresAt: inviteData.expiresAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Error creating invite:", err);
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

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
