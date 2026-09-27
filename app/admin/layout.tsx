import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isAdminRole } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/**
 * Server-side gate for every /admin page.
 * middleware.ts only checks a browser-set `role` cookie, which anyone can forge;
 * this layout verifies the Firebase session and the role on the server.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionCookie = (await cookies()).get("__session")?.value;
  if (!sessionCookie) redirect("/auth/login?redirectPath=/admin");

  let uid: string;
  let claimRole: string | undefined;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
    claimRole = (decoded as any).role;
  } catch {
    redirect("/auth/login?redirectPath=/admin");
  }

  let role = claimRole;
  if (!role) {
    const snap = await adminDb.collection("profiles").doc(uid!).get();
    role = snap.exists ? (snap.data() as any)?.role : undefined;
  }

  if (!isAdminRole(role)) redirect("/dashboard");

  return <>{children}</>;
}
