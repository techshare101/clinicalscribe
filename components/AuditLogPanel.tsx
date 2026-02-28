"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  ScrollText,
  RefreshCw,
  Loader2,
  UserPlus,
  UserMinus,
  ShieldAlert,
  Shield,
  Clock,
  Filter,
} from "lucide-react";

type AuditEntry = {
  id: string;
  action: string;
  performedBy: string;
  performedByEmail: string;
  targetUid?: string;
  orgId?: string;
  role?: string;
  inviteId?: string;
  timestamp: string | null;
};

const actionConfig: Record<string, { label: string; icon: any; color: string }> = {
  invite_accepted: { label: "Invite Accepted", icon: UserPlus, color: "text-green-600 bg-green-50" },
  member_removed: { label: "Member Removed", icon: UserMinus, color: "text-red-600 bg-red-50" },
  role_changed: { label: "Role Changed", icon: ShieldAlert, color: "text-indigo-600 bg-indigo-50" },
  invite_created: { label: "Invite Sent", icon: UserPlus, color: "text-blue-600 bg-blue-50" },
  invite_revoked: { label: "Invite Revoked", icon: UserMinus, color: "text-amber-600 bg-amber-50" },
};

const defaultAction = { label: "System Event", icon: Shield, color: "text-gray-600 bg-gray-50" };

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  async function fetchLogs() {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.action === filter);
  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-500">Track all administrative actions and changes</p>
        </div>
        <div className="flex items-center gap-3">
          {uniqueActions.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Events</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {actionConfig[action]?.label || action}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading audit log...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16">
          <ScrollText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No audit events yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Actions like role changes, invites, and member removals will appear here.
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => {
              const config = actionConfig[log.action] || defaultAction;
              const Icon = config.icon;
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`p-2 rounded-lg ${config.color} shrink-0 mt-0.5`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">{config.label}</span>
                      {log.role && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {log.role}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      by {log.performedByEmail || log.performedBy?.slice(0, 8) + "..."}
                      {log.targetUid && (
                        <span className="text-gray-400"> &middot; target: {log.targetUid.slice(0, 8)}...</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredLogs.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing {filteredLogs.length} of {logs.length} events
        </p>
      )}
    </div>
  );
}
