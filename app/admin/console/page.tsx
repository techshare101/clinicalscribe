"use client";

import { withRoleGuard } from "@/lib/withRoleGuard";
import { useRouter } from "next/navigation";
import { useSeedDemo } from "@/hooks/useSeedDemo";
import RoleManagementPanel from "@/components/RoleManagementPanel";

function AdminConsolePage({ userRole }: { userRole?: string }) {
  const router = useRouter();
  const { seedDemo, loading } = useSeedDemo();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Training Tools</h1>
          <p className="mt-2 text-gray-600">Tools for nurse administrators to manage training and demos</p>
        </div>
        
        <div className="space-y-6">
          {/* SOAP Demo Tools */}
          <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
            <h2 className="text-lg font-semibold mb-4">SOAP Demo Tools</h2>
            <p className="text-gray-600 mb-4">
              Create demo SOAP notes and patient data for training purposes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/soap?demo=true")}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium">Create Demo SOAP Note</h3>
                <p className="text-sm text-gray-600">Generate sample SOAP notes for training</p>
              </button>
              
              <button
                onClick={seedDemo}
                disabled={loading}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left disabled:opacity-50"
              >
                <h3 className="font-medium">Seed Demo Subscription</h3>
                <p className="text-sm text-gray-600">
                  {loading ? "Seeding..." : "Activate demo Pro features for testing"}
                </p>
              </button>
            </div>
          </div>

          {/* Role Management Panel */}
          <RoleManagementPanel />

          {/* Additional Management Tools */}
          <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
            <h2 className="text-lg font-semibold mb-4">Additional Tools</h2>
            <p className="text-gray-600 mb-4">
              Advanced management and reporting tools.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/admin/training-stats")}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium">Training Statistics</h3>
                <p className="text-sm text-gray-600">View training progress and usage stats</p>
              </button>
              
              <button
                onClick={() => router.push("/admin/audit-logs")}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium">Audit Logs</h3>
                <p className="text-sm text-gray-600">View system activity and role changes</p>
              </button>
            </div>
          </div>

          {/* System Admin Link (if applicable) */}
          {userRole === "system-admin" && (
            <div className="p-6 rounded-xl border bg-red-50 shadow-sm">
              <h2 className="text-lg font-semibold mb-2 text-red-900">System Admin Access</h2>
              <p className="text-red-700 mb-4">
                You have system admin privileges. Access the full admin panel for advanced features.
              </p>
              <button
                onClick={() => router.push("/admin/demo")}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Go to Admin Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(AdminConsolePage, {
  allowedRoles: ["nurse-admin", "system-admin"],
  redirectTo: "/dashboard",
});
