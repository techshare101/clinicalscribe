import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";

/**
 * Server-side identity for API routes.
 *
 * Accepts either:
 *  - `Authorization: Bearer <Firebase ID token>`, or
 *  - the `__session` cookie minted by /api/session (sent automatically on same-origin fetches).
 *
 * Role comes from the verified custom claim first, then the Firestore profile.
 * Profile `role` is only trustworthy once firestore.rules blocks users from writing it
 * (see the rules change in this same patch).
 */
export type ApiUser = { uid: string; email?: string; role: string };

export const ADMIN_ROLES = ["admin", "system-admin", "nurse-admin"] as const;

export async function getApiUser(req: Request): Promise<ApiUser | null> {
  let uid: string | undefined;
  let email: string | undefined;
  let claimRole: string | undefined;

  try {
    const authz = req.headers.get("authorization");
    if (authz?.startsWith("Bearer ")) {
      const decoded = await adminAuth.verifyIdToken(authz.slice("Bearer ".length));
      uid = decoded.uid;
      email = decoded.email;
      claimRole = (decoded as any).role;
    } else {
      const sessionCookie = (await cookies()).get("__session")?.value;
      if (!sessionCookie) return null;
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
      email = decoded.email;
      claimRole = (decoded as any).role;
    }
  } catch {
    // If auth verification failed, check dev override below
  }

  if (!uid) {
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS === "true") {
      return { uid: "dev-user-id", email: "dev@example.com", role: "admin" };
    }
    return null;
  }

  let role = claimRole;
  if (!role) {
    try {
      const snap = await adminDb.collection("profiles").doc(uid).get();
      role = (snap.exists && (snap.data() as any)?.role) || undefined;
    } catch {
      role = undefined;
    }
  }

  return { uid, email, role: role || "nurse" };
}

export function isAdminRole(role: string | undefined): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

/** Use at the top of any API route that needs a signed-in user. */
export async function requireApiUser(
  req: Request
): Promise<{ user: ApiUser; response?: undefined } | { user?: undefined; response: NextResponse }> {
  const user = await getApiUser(req);
  if (!user) {
    return { response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  return { user };
}

/** Use at the top of any admin API route. */
export async function requireApiAdmin(
  req: Request
): Promise<{ user: ApiUser; response?: undefined } | { user?: undefined; response: NextResponse }> {
  const user = await getApiUser(req);
  if (!user) {
    return { response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  if (!isAdminRole(user.role)) {
    return { response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { user };
}
