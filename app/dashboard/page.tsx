"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthChecked(true);
      if (!u) return;
      try {
        setLoadingProfile(true);
        const ref = doc(db, "profiles", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          // Create a default profile for new users
          const initial = {
            uid: u.uid,
            email: u.email || null,
            displayName: u.displayName || (u.email ? u.email.split("@")[0] : "New User"),
            betaActive: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(ref, initial, { merge: true });
          const fresh = await getDoc(ref);
          setProfile(fresh.exists() ? fresh.data() : initial);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      // Not logged in, redirect to signup
      router.push("/auth/signup");
    }
  }, [authChecked, user, router]);

  if (!authChecked || (user && loadingProfile)) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Loading your account…</p>
      </main>
    );
  }

  if (!user) {
    // Brief placeholder before redirect
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Redirecting…</p>
      </main>
    );
  }

  const displayName = profile?.displayName || user.displayName || "new user";

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-700 mt-2">Welcome, {displayName}.</p>
      <div className="mt-3">
        <EhrStatusBadge />
      </div>
      {profile?.betaActive === false && (
        <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          Beta access is not active on your account.
        </div>
      )}
    </main>
  );
}
