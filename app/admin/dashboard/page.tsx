"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import DemoAccountsAdmin from "@/components/DemoAccountsAdmin";
import RoleManagementPanel from "@/components/RoleManagementPanel";
import SeedSOAPHistoryDemo from "@/components/SeedSOAPHistoryDemo";
import { useUserRole } from "@/hooks/useUserRole";
import { withRoleGuard } from "@/lib/withRoleGuard";
import { 
  CreditCard, 
  FileText, 
  Users, 
  Shield,
  Activity,
  Settings
} from "lucide-react";

function AdminDashboardContent() {
  const { role, isSystemAdmin, isNurseAdmin, loading } = useUserRole();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Define tabs with role-based visibility
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: Activity,
      visible: true,
    },
    {
      id: "subscriptions",
      label: "Demo Subscriptions",
      icon: CreditCard,
      visible: isSystemAdmin, // Only system admins can manage subscriptions
    },
    {
      id: "soap",
      label: "SOAP Demo Data",
      icon: FileText,
      visible: true, // Both admin types can seed SOAP data
    },
    {
      id: "roles",
      label: "Role Management",
      icon: Users,
      visible: true, // Both can see, but nurse-admin is view-only
    },
  ].filter(tab => tab.visible);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                {isSystemAdmin 
                  ? "Full system administration access" 
                  : "Training tools and role management"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Logged in as: <span className="font-semibold">{role}</span>
            </span>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            {/* Mobile dropdown */}
            <div className="sm:hidden p-4">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop tabs with mobile horizontal scroll */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <nav className="flex space-x-0 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        relative px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap
                        ${activeTab === tab.id 
                          ? 'text-indigo-600 bg-indigo-50' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </div>
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
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
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Quick Stats */}
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Active Role</h3>
                    <p className="text-3xl font-bold">
                      {role === "system-admin" ? "System Admin" : "Nurse Admin"}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Available Tools</h3>
                    <p className="text-3xl font-bold">{tabs.length - 1}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Access Level</h3>
                    <p className="text-3xl font-bold">
                      {isSystemAdmin ? "Full" : "Limited"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab("soap")}
                      className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
                    >
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <div className="text-left">
                        <p className="font-semibold">Seed SOAP Data</p>
                        <p className="text-sm text-gray-600">Create demo patient records</p>
                      </div>
                    </button>
                    
                    {isSystemAdmin && (
                      <button
                        onClick={() => setActiveTab("subscriptions")}
                        className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
                      >
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                        <div className="text-left">
                          <p className="font-semibold">Manage Subscriptions</p>
                          <p className="text-sm text-gray-600">Demo Stripe subscriptions</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "subscriptions" && isSystemAdmin && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DemoAccountsAdmin />
              </motion.div>
            )}

            {activeTab === "soap" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SeedSOAPHistoryDemo />
              </motion.div>
            )}

            {activeTab === "roles" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RoleManagementPanel />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with role guard - both admin types can access
export default withRoleGuard(AdminDashboardContent, {
  allowedRoles: ["system-admin", "nurse-admin"],
  redirectTo: "/dashboard"
});
