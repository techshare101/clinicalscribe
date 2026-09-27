"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleManagementPanel from "@/components/RoleManagementPanel";
import SeedSOAPHistoryDemo from "@/components/SeedSOAPHistoryDemo";
import HealthcheckWidget from "@/components/HealthcheckWidget";
import OrganizationPanel from "@/components/OrganizationPanel";
import AuditLogPanel from "@/components/AuditLogPanel";
import { useUserRole } from "@/hooks/useUserRole";
import { withRoleGuard } from "@/lib/withRoleGuard";
import { auth } from "@/lib/firebase";
import {
  Building2,
  Users,
  Shield,
  ShieldCheck,
  Activity,
  Settings,
  GraduationCap,
  ScrollText,
  TrendingUp,
  UserCheck,
  Clock,
} from "lucide-react";

function AdminDashboardContent() {
  const { role, isSystemAdmin, isNurseAdmin, loading } = useUserRole();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<{
    totalUsers: number;
    proUsers: number;
    orgName: string | null;
  }>({ totalUsers: 0, proUsers: 0, orgName: null });

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const [usersRes, orgRes] = await Promise.all([
          fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/organizations", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (usersRes.ok) {
          const userData = await usersRes.json();
          const users = userData.users || [];
          setStats((prev) => ({
            ...prev,
            totalUsers: users.length,
            proUsers: users.filter((u: any) => u.betaActive).length,
          }));
        }

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setStats((prev) => ({
            ...prev,
            orgName: orgData.org?.name || null,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity, visible: true },
    { id: "organization", label: "Organization", icon: Building2, visible: true },
    { id: "team", label: "Team & Access", icon: Users, visible: true },
    { id: "training", label: "Training Tools", icon: GraduationCap, visible: true },
    { id: "audit", label: "Audit Log", icon: ScrollText, visible: isSystemAdmin },
  ].filter((tab) => tab.visible);

  const roleDisplay =
    role === "system-admin"
      ? "System Administrator"
      : role === "nurse-admin"
      ? "Nurse Administrator"
      : "Nurse";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  Admin Console
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                  {stats.orgName ? `${stats.orgName} \u2022 ` : ""}
                  {roleDisplay}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full shadow-sm">
              <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{roleDisplay}</span>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-800">
            {/* Mobile dropdown */}
            <div className="sm:hidden p-3">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop tabs */}
            <div className="hidden sm:block overflow-x-auto">
              <nav className="flex min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-5 py-3.5 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? "text-indigo-700 dark:text-indigo-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                        <span>{tab.label}</span>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="adminTab"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white">
                      <div className="relative z-10">
                        <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Total Users</p>
                        <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                      </div>
                      <Users className="absolute -right-2 -bottom-2 h-16 w-16 text-indigo-400/30" />
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white">
                      <div className="relative z-10">
                        <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Pro Licenses</p>
                        <p className="text-3xl font-bold mt-1">{stats.proUsers}</p>
                      </div>
                      <UserCheck className="absolute -right-2 -bottom-2 h-16 w-16 text-emerald-400/30" />
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 p-5 text-white">
                      <div className="relative z-10">
                        <p className="text-violet-100 text-xs font-medium uppercase tracking-wider">Your Role</p>
                        <p className="text-lg font-bold mt-1 leading-tight">
                          {role === "system-admin" ? "System Admin" : "Nurse Admin"}
                        </p>
                      </div>
                      <Shield className="absolute -right-2 -bottom-2 h-16 w-16 text-violet-400/30" />
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
                      <div className="relative z-10">
                        <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">Organization</p>
                        <p className="text-lg font-bold mt-1 leading-tight truncate">
                          {stats.orgName || "Not set up"}
                        </p>
                      </div>
                      <Building2 className="absolute -right-2 -bottom-2 h-16 w-16 text-amber-400/30" />
                    </div>
                  </div>

                  {/* System Health */}
                  <HealthcheckWidget />

                  {/* Quick Actions */}
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <button
                        onClick={() => setActiveTab("organization")}
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all group"
                      >
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Manage Organization</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Invite members, manage seats</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("team")}
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all group"
                      >
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                          <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Team & Access</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Roles, permissions, Pro access</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("training")}
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition-all group"
                      >
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-colors">
                          <GraduationCap className="h-5 w-5 text-violet-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Training Tools</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Seed sample data for onboarding</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "organization" && (
                <motion.div
                  key="organization"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <OrganizationPanel />
                </motion.div>
              )}

              {activeTab === "team" && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <RoleManagementPanel />
                </motion.div>
              )}

              {activeTab === "training" && (
                <motion.div
                  key="training"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SeedSOAPHistoryDemo />
                </motion.div>
              )}

              {activeTab === "audit" && isSystemAdmin && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <AuditLogPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(AdminDashboardContent, {
  allowedRoles: ["system-admin", "nurse-admin"],
  redirectTo: "/dashboard",
});
