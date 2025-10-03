"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user } = useAuth();
  const { role, loading } = useUserRole();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-emerald-600">
                ClinicalScribe
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/dashboard")
                    ? "border-emerald-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Dashboard
              </Link>

              <Link
                href="/soap"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/soap")
                    ? "border-emerald-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                SOAP
              </Link>

              <Link
                href="/soap-history"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/soap-history")
                    ? "border-emerald-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                History
              </Link>

              <Link
                href="/patients"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/patients")
                    ? "border-emerald-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Patients
              </Link>

              <Link
                href="/subscription"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/subscription")
                    ? "border-emerald-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Subscription
              </Link>

              {/* Role-specific links */}
              {!loading && role === "nurse-admin" && (
                <Link
                  href="/admin/console"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    isActive("/admin/console")
                      ? "border-indigo-500 text-indigo-900"
                      : "border-transparent text-indigo-600 hover:border-indigo-300 hover:text-indigo-800"
                  )}
                >
                  Training Tools
                </Link>
              )}

              {!loading && role === "system-admin" && (
                <>
                  <Link
                    href="/admin/console"
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      isActive("/admin/console")
                        ? "border-indigo-500 text-indigo-900"
                        : "border-transparent text-indigo-600 hover:border-indigo-300 hover:text-indigo-800"
                    )}
                  >
                    Training Tools
                  </Link>
                  <Link
                    href="/admin/demo"
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium relative",
                      isActive("/admin/demo")
                        ? "border-red-500 text-red-900"
                        : "border-transparent text-red-600 hover:border-red-300 hover:text-red-800"
                    )}
                  >
                    Admin Panel
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Admin
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}