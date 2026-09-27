import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

// GET  — fetch the caller's organization (or null)
// POST — create a new organization
export async function GET(req: NextRequest) {
  try {
    const decoded = await verifyAdmin(req);
    if (!decoded) return unauthorized();

    const profile = await adminDb.collection("profiles").doc(decoded.uid).get();
    const orgId = profile.get("orgId");

    if (!orgId) {
      return NextResponse.json({ org: null });
    }

    const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
    if (!orgSnap.exists) {
      return NextResponse.json({ org: null });
    }

    // Count current members
    const membersSnap = await adminDb
      .collection("profiles")
      .where("orgId", "==", orgId)
      .get();

    return NextResponse.json({
      org: {
        id: orgSnap.id,
        ...orgSnap.data(),
        memberCount: membersSnap.size,
      },
    });
  } catch (err: any) {
    console.error("Error fetching organization:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyAdmin(req);
    if (!decoded) return unauthorized();

    // Check caller is at least nurse-admin
    const profile = await adminDb.collection("profiles").doc(decoded.uid).get();
    const callerRole = profile.get("role") || "nurse";
    if (!["nurse-admin", "system-admin"].includes(callerRole)) {
      return NextResponse.json(
        { error: "Admin access required to create an organization" },
        { status: 403 }
      );
    }

    // Check if caller already has an org
    if (profile.get("orgId")) {
      return NextResponse.json(
        { error: "You already belong to an organization" },
        { status: 400 }
      );
    }

    const { name, seats } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Organization name is required (min 2 characters)" },
        { status: 400 }
      );
    }

    const seatCount = Math.max(1, Math.min(seats || 10, 500));

    // Create the organization
    const orgRef = adminDb.collection("organizations").doc();
    const orgData = {
      name: name.trim(),
      seats: seatCount,
      plan: "team",
      createdBy: decoded.uid,
      createdByEmail: decoded.email || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await orgRef.set(orgData);

    // Link the creator to the org
    await adminDb.collection("profiles").doc(decoded.uid).set(
      {
        orgId: orgRef.id,
        orgRole: "org-admin",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      org: { id: orgRef.id, ...orgData, memberCount: 1 },
    });
  } catch (err: any) {
    console.error("Error creating organization:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- Helpers ---
async function verifyAdmin(req: NextRequest) {
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
