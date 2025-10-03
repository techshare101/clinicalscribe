"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserRole = "nurse" | "nurse-admin" | "system-admin";

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        
        if (!profileDoc.exists()) {
          // Create default profile with nurse role
          setRole("nurse");
        } else {
          const profileData = profileDoc.data();
          const userRole = (profileData?.role as UserRole) || "nurse";
          setRole(userRole);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError("Failed to fetch user role");
        setRole("nurse"); // Default to most restrictive
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchRole();
    }
  }, [user, authLoading]);

  const isNurse = role === "nurse";
  const isNurseAdmin = role === "nurse-admin";
  const isSystemAdmin = role === "system-admin";
  const isAdmin = isNurseAdmin || isSystemAdmin;

  return {
    role,
    loading: authLoading || loading,
    error,
    isNurse,
    isNurseAdmin,
    isSystemAdmin,
    isAdmin,
  };
}