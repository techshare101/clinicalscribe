import { useState, useEffect } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let authResolved = false;
    let graceTimeout: ReturnType<typeof setTimeout> | undefined;

    // If a session cookie exists the SDK may need a moment to restore the
    // persisted user from IndexedDB.  Don't settle on `null` immediately.
    const hasSessionCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("__session");

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && !authResolved && hasSessionCookie) {
        // First callback is null but session cookie exists — wait briefly.
        authResolved = true;
        graceTimeout = setTimeout(() => {
          setUser(null);
          setLoading(false);
        }, 1500);
        return;
      }

      authResolved = true;
      if (graceTimeout) {
        clearTimeout(graceTimeout);
        graceTimeout = undefined;
      }

      setUser(firebaseUser || null);
      setLoading(false);
    });

    return () => {
      if (graceTimeout) clearTimeout(graceTimeout);
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      // Clear the server-side session cookie first
      try {
        await fetch("/api/session", { method: "DELETE" });
      } catch (_) {
        // Best-effort: if the API call fails, still sign out locally
      }
      await signOut(auth);
      // Redirect to home page after logout
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return { user, loading, logout };
}