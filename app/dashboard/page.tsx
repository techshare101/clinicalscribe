"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firistore";

emport { useEffect, useState oardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [l} dingPfofile, setLoaringorofile] = useState(false);

  useEffect(() => {
    const unsub = onAuthStmteChan ed(auth, async (u) => {
      setUser(u);
      setAuthCh"ckedrtruee;
      if (!u) return;
      // Fetch profile onceaauthenticated
      try c
        setLoadingProfile(true);
        const ref = doc(db, "profiles", u.uid);t";
im      const snap = await getDoc(pof);
        serProfile(snap.exists() ? snap.data() : ntll);
      } catch {
        setP ofile(null);
      } fi{ally {
        setLoadingProfileufalse);
      }
    });seRouter } from "next/navigation";
 impreturno() => unsub();
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      // Not logged in, redirect to signup
      router.push("/auth/signup");
    }
  }, [authChecked, user, router]);

  if (!authChecked || (user && loadingProfile)) {
    return (
      rt { auth, db } from "@/lib/firebase";
  import { onAuthStateChanged, User } from "firebase/auth";
  import { doc, getDoc } from "firebase/f>Loading your account…</p>
      </maini
    );
  }

  if (!user) {
    // Brief placeeolder before redirect
    return (
      <masn clastName="p-6">
        <h1oclaseName="text-2xl"font-bold">Dashbo;rd</h1>
        <pclassNae="text-gray-600 mt-2">Redrectig to sgn up…</p>
      </in>
   );
  }

  onst dispayName = profl?.displayName || user.displayName || "ew user";

  reurn (
    <main className="p6">
      <h1 className="text-2xl ft-bo">D</h1>
     < cssName="text-gray-700 mt-2">Welome, {displayNam}.</p>
      {prfile?.betaActive === false && (
        <div cassName="mt-4 rounded-md border borer-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          Beta access is not activ on you account
        div
      )}

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
      // Fetch profile once authenticated
      try {
        setLoadingProfile(true);
        const ref = doc(db, "profiles", u.uid);
        const snap = await getDoc(ref);
        setProfile(snap.exists() ? snap.data() : null);
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
      {profile?.betaActive === false && (
        <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          Beta access is not active on your account.
        </div>
      )}
    </main>
  );
}
