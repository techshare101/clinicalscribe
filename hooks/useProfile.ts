"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export type Profile = {
  uid?: string;
  role?: string;
  betaActive?: boolean;
  email?: string;
  displayName?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
} | null;

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;
    let unsubDoc: (() => void) | undefined;
    let authResolved = false;

    // Check for an existing session cookie — if present, Firebase should
    // restore the persisted auth from IndexedDB.  Give it a short grace
    // period before we accept `null` as "truly signed-out".
    const hasSessionCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("__session");

    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = undefined;
      }

      if (!user) {
        if (!authResolved && hasSessionCookie) {
          // First callback is null but a session cookie exists — the SDK
          // is still restoring auth from IndexedDB.  Wait briefly so we
          // don't flash the unauthenticated UI.
          authResolved = true;
          const timeout = setTimeout(() => {
            // If auth still hasn't resolved to a user by now, accept null.
            setProfile(null);
            setIsLoading(false);
          }, 1500);
          // If a subsequent onAuthStateChanged fires with a user, the
          // timeout will be cleared by the cleanup or overridden below.
          // Store the timeout so cleanup can clear it.
          (unsubAuth as any).__timeout = timeout;
          return;
        }
        setProfile(null);
        setIsLoading(false);
        return;
      }

      authResolved = true;
      // Clear any pending null-acceptance timeout
      if ((unsubAuth as any)?.__timeout) {
        clearTimeout((unsubAuth as any).__timeout);
      }

      const ref = doc(db, "profiles", user.uid);
      unsubDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as any);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      });
    });

    return () => {
      if ((unsubAuth as any)?.__timeout) {
        clearTimeout((unsubAuth as any).__timeout);
      }
      if (unsubDoc) unsubDoc();
      if (unsubAuth) unsubAuth();
    };
  }, []);

  return { profile, isLoading };
}
