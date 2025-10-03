"use client";

import DemoAccountsAdmin from "@/components/DemoAccountsAdmin";
import { withRoleGuard } from "@/lib/withRoleGuard";
import { useRouter } from "next/navigation";

function AdminDemoPage({ userRole }: { userRole?: string }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage demo accounts and test subscriptions</p>
        </div>
        
        <div className="space-y-6">
          <DemoAccountsAdmin />
          
          {/* Additional admin sections can go here */}
          <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push("/dashboard")}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium">Go to Dashboard</h3>
                <p className="text-sm text-gray-600">View the main app dashboard</p>
              </button>
              
              <button 
                onClick={() => router.push("/pricing")}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium">View Pricing</h3>
                <p className="text-sm text-gray-600">Check pricing plans</p>
              </button>
              
              <button 
                onClick={() => window.open("https://dashboard.stripe.com/test", "_blank")}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium">Stripe Dashboard</h3>
                <p className="text-sm text-gray-600">Open Stripe test mode</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(AdminDemoPage, {
  allowedRoles: ["system-admin"],
  redirectTo: "/dashboard",
});
