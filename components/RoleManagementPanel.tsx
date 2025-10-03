"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, ShieldAlert, ShieldCheck, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import BetaAccessToggle from "@/components/BetaAccessToggle";

type User = {
  uid: string;
  email: string;
  displayName?: string;
  role: string;
  betaActive?: boolean;
  subscriptionStatus?: string;
  updatedAt?: string;
  roleUpdatedAt?: string;
};

const roleConfig: Record<string, { label: string; color: string; icon: any; description: string }> = {
  "nurse": {
    label: "Nurse",
    color: "bg-gray-100 text-gray-700",
    icon: Shield,
    description: "Standard access to patient records and SOAP notes"
  },
  "nurse-admin": {
    label: "Nurse Admin",
    color: "bg-indigo-100 text-indigo-700",
    icon: ShieldAlert,
    description: "Access to training tools and user management"
  },
  "system-admin": {
    label: "System Admin",
    color: "bg-red-100 text-red-700",
    icon: ShieldCheck,
    description: "Full system access including demo accounts"
  }
};

// Only these roles are valid
const VALID_ROLES = ["nurse", "nurse-admin", "system-admin"] as const;
type ValidRole = typeof VALID_ROLES[number];

export default function RoleManagementPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [callerRole, setCallerRole] = useState<string>("nurse");
  const { isSystemAdmin } = useUserRole();
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    uid: string;
    email: string;
    currentRole: string;
    newRole: string;
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users || []);
      setCallerRole(data.callerRole || "nurse");
    } catch (err) {
      console.error("Error loading users", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(uid: string, newRole: string) {
    setBusyUid(uid);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const res = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, role: newRole }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update role");
      }

      const result = await res.json();
      toast.success(result.message || "Role updated successfully");
      await load();
    } catch (err) {
      console.error("Error updating role:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyUid(null);
      setConfirmModal(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const canEditRoles = callerRole === "system-admin";

  return (
    <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">User Role Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            {canEditRoles 
              ? "Manage user roles and permissions across the system" 
              : "View user roles and permissions (read-only access)"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading users...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Current Role</th>
                <th className="pb-3 font-medium">Subscription</th>
                <th className="pb-3 font-medium">Last Updated</th>
                {canEditRoles && <th className="pb-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const roleInfo = roleConfig[user.role] || roleConfig.nurse;
                const RoleIcon = roleInfo.icon;
                
                return (
                  <tr key={user.uid} className="group">
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{user.email || "Unknown"}</div>
                        {user.displayName && (
                          <div className="text-xs text-gray-500">{user.displayName}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">ID: {user.uid.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4" />
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{roleInfo.description}</div>
                    </td>
                    <td className="py-3">
                      <div className="space-y-2">
                        <div className="text-sm">
                          {user.betaActive ? (
                            <span className="text-green-600 font-medium">Pro Active</span>
                          ) : (
                            <span className="text-gray-500">Free</span>
                          )}
                          {user.subscriptionStatus && (
                            <div className="text-xs text-gray-500">{user.subscriptionStatus}</div>
                          )}
                        </div>
                        {/* Beta access toggle for admins */}
                        {canEditRoles && (
                          <BetaAccessToggle 
                            uid={user.uid} 
                            email={user.email}
                            currentBetaStatus={user.betaActive || false}
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-xs text-gray-500">
                        {user.roleUpdatedAt 
                          ? new Date(user.roleUpdatedAt).toLocaleDateString()
                          : "Never"}
                      </div>
                    </td>
                    {canEditRoles && (
                      <td className="py-3">
                        {busyUid === user.uid ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Updating...</span>
                          </div>
                        ) : (
                          <div className="relative group/menu">
                            <button className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
                              Change Role
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                              {Object.entries(roleConfig).map(([roleKey, config]) => (
                                <button
                                  key={roleKey}
                                  onClick={() => setConfirmModal({
                                    open: true,
                                    uid: user.uid,
                                    email: user.email,
                                    currentRole: user.role,
                                    newRole: roleKey
                                  })}
                                  disabled={user.role === roleKey}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <config.icon className="h-4 w-4" />
                                    <span className={user.role === roleKey ? "font-medium" : ""}>
                                      {config.label}
                                    </span>
                                    {user.role === roleKey && (
                                      <span className="ml-auto text-xs text-gray-500">(current)</span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          open={confirmModal.open}
          title="Confirm Role Change"
          description={`Are you sure you want to change ${confirmModal.email}'s role from "${roleConfig[confirmModal.currentRole]?.label}" to "${roleConfig[confirmModal.newRole]?.label}"?

This will ${confirmModal.newRole === "system-admin" 
            ? "grant full system administrator privileges" 
            : confirmModal.newRole === "nurse-admin"
            ? "grant nurse administrator privileges"
            : "remove all administrative privileges"}.`}
          confirmText="Change Role"
          cancelText="Cancel"
          variant={confirmModal.newRole === "system-admin" ? "danger" : "warning"}
          onConfirm={() => updateRole(confirmModal.uid, confirmModal.newRole)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}