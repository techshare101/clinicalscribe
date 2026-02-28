import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    // Only system-admin can view audit logs
    const profile = await adminDb.collection("profiles").doc(decoded.uid).get();
    const role = profile.get("role") || "nurse";
    if (role !== "system-admin") {
      return NextResponse.json({ error: "System admin access required" }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection("audit_logs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("Error fetching audit logs:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
