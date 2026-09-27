import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// GET — validate an invite token (no auth required, used on signup page)
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ valid: false, error: "Token is required" });
    }

    const snapshot = await adminDb
      .collection("invites")
      .where("inviteToken", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ valid: false, error: "Invalid or expired invite" });
    }

    const invite = snapshot.docs[0].data();

    // Check expiry
    const expiresAt = invite.expiresAt?.toDate?.() || invite.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: "This invite has expired" });
    }

    return NextResponse.json({
      valid: true,
      orgName: invite.orgName || "Unknown Organization",
      email: invite.email,
      role: invite.role,
    });
  } catch (err: any) {
    console.error("Error validating invite:", err);
    return NextResponse.json({ valid: false, error: "Validation failed" });
  }
}
