"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserRole = "nurse" | "nurse-admin" | "system-admin";

interface WithRoleGuardOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function withRoleGuard<T extends object>(
  Component: React.ComponentType<T>,
  options: WithRoleGuardOptions
) {
  return function GuardedComponent(props: T) {
    const { user, loading: authLoading } = useAuth();
    const [role, setRole] = useState<UserRole | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      async function checkRole() {
        if (!user) {
          setRole(null);
          setRoleLoading(false);
          return;
        }

        try {
          const profileDoc = await getDoc(doc(db, "profiles", user.uid));
          const profileData = profileDoc.data();
          const userRole = (profileData?.role as UserRole) || "nurse";
          setRole(userRole);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("nurse"); // Default to most restrictive
        } finally {
          setRoleLoading(false);
        }
      }

      if (!authLoading) {
        checkRole();
      }
    }, [user, authLoading]);

    useEffect(() => {
      if (!authLoading && !roleLoading) {
        if (!user) {
          router.push("/login");
          return;
        }

        if (role && !options.allowedRoles.includes(role)) {
          router.push(options.redirectTo || "/dashboard");
        }
      }
    }, [user, role, authLoading, roleLoading, router]);

    if (authLoading || roleLoading) {
      return (
        options.loadingComponent || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        )
      );
    }

    if (!user || !role || !options.allowedRoles.includes(role)) {
      return null;
    }

    return <Component {...props} userRole={role} />;
  };
}