"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Mail,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  UserPlus,
  XCircle,
  Clock,
  Shield,
  ShieldAlert,
  ChevronDown,
  Trash2,
} from "lucide-react";

type Org = {
  id: string;
  name: string;
  seats: number;
  plan: string;
  memberCount: number;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  orgName: string;
  invitedByEmail: string;
  createdAt: string | null;
  acceptedAt: string | null;
};

const roleLabels: Record<string, string> = {
  nurse: "Nurse",
  "nurse-admin": "Nurse Admin",
};

export default function OrganizationPanel() {
  const [org, setOrg] = useState<Org | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSeats, setOrgSeats] = useState(10);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("nurse");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function getToken() {
    return await auth.currentUser?.getIdToken();
  }

  async function loadOrg() {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/admin/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrg(data.org);

      if (data.org) {
        const invRes = await fetch("/api/admin/invites", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const invData = await invRes.json();
        setInvites(invData.invites || []);
      }
    } catch (err) {
      console.error("Error loading org:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: orgName, seats: orgSeats }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Organization "${orgName}" created!`);
      setShowCreateForm(false);
      await loadOrg();
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      await loadOrg();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/admin/invites/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Invite revoked");
      await loadOrg();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke invite");
    }
  }

  async function removeMember(memberUid: string, email: string) {
    if (!confirm(`Remove ${email} from the organization?`)) return;

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/admin/invites/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberUid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`${email} removed from organization`);
      await loadOrg();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    }
  }

  function copyInviteLink(inviteLink: string) {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(inviteLink);
    toast.success("Invite link copied to clipboard");
    setTimeout(() => setCopiedLink(null), 3000);
  }

  useEffect(() => {
    loadOrg();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
        <div className="flex items-center gap-2 py-8 justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-gray-500">Loading organization...</span>
        </div>
      </div>
    );
  }

  // No org yet — show create form
  if (!org) {
    return (
      <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organization Yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create an organization to invite team members. Members you invite will automatically 
            get access to ClinicalScribe with their assigned role.
          </p>

          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Organization
            </button>
          ) : (
            <form onSubmit={createOrg} className="max-w-sm mx-auto space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. ACME Healthcare"
                  required
                  minLength={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Seats</label>
                <input
                  type="number"
                  value={orgSeats}
                  onChange={(e) => setOrgSeats(Number(e.target.value))}
                  min={1}
                  max={500}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum number of team members</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Org exists — show dashboard
  const pendingInvites = invites.filter((i) => i.status === "pending");
  const acceptedInvites = invites.filter((i) => i.status === "accepted");
  const usedSeats = org.memberCount + pendingInvites.length;

  return (
    <div className="space-y-6">
      {/* Org Header */}
      <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{org.name}</h2>
              <p className="text-sm text-gray-500">
                {usedSeats} / {org.seats} seats used
              </p>
            </div>
          </div>
          <button
            onClick={loadOrg}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Seat Usage Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usedSeats / org.seats > 0.8 ? "bg-red-500" : "bg-indigo-500"
            }`}
            style={{ width: `${Math.min(100, (usedSeats / org.seats) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{org.memberCount} members + {pendingInvites.length} pending</span>
          <span>{org.seats - usedSeats} seats available</span>
        </div>
      </div>

      {/* Invite Form */}
      <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
        <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-indigo-600" />
          Invite Team Member
        </h3>
        <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="nurse@company.com"
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="appearance-none px-3 py-2 pr-8 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="nurse">Nurse</option>
              <option value="nurse-admin">Nurse Admin</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={inviting || usedSeats >= org.seats}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {usedSeats >= org.seats && (
          <p className="text-xs text-red-500 mt-2">
            All seats are used. Remove a member or upgrade to invite more.
          </p>
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Invites ({pendingInvites.length})
          </h3>
          <div className="space-y-3">
            {pendingInvites.map((invite) => {
              const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
              const link = `${baseUrl}/auth/signup?invite=${(invite as any).inviteToken || ""}`;

              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-gray-500">
                        {roleLabels[invite.role] || invite.role} &middot; Invited{" "}
                        {invite.createdAt
                          ? new Date(invite.createdAt).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyInviteLink(link)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      title="Copy invite link"
                    >
                      {copiedLink === link ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => revokeInvite(invite.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded"
                      title="Revoke invite"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted / Active Members */}
      {acceptedInvites.length > 0 && (
        <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Team Members ({acceptedInvites.length})
          </h3>
          <div className="space-y-3">
            {acceptedInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {invite.role === "nurse-admin" ? (
                    <ShieldAlert className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <Shield className="h-4 w-4 text-green-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-gray-500">
                      {roleLabels[invite.role] || invite.role} &middot; Joined{" "}
                      {invite.acceptedAt
                        ? new Date(invite.acceptedAt).toLocaleDateString()
                        : "recently"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeMember((invite as any).acceptedBy, invite.email)}
                  className="p-1.5 text-red-400 hover:text-red-600 rounded"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
