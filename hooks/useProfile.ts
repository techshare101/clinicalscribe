"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export type Profile = {
  uid?: string;
  role?: string;
  [key: string]: any;
} | null;

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(null);

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;
    let unsubDoc: (() => void) | undefined;

    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = undefined;
      }
      if (!user) {
        setProfile(null);
        return;
      }
      const ref = doc(db, "profiles", user.uid);
      unsubDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as any);
        } else {
          setProfile(null);
        }
      });
    });

    return () => {
      if (unsubDoc) unsubDoc();
      if (unsubAuth) unsubAuth();
    };
  }, []);

  return profile;
}
