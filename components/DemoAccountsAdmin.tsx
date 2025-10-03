"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import ConfirmModal from "@/components/ConfirmModal";

type DemoProfile = {
  uid: string;
  email: string;
  displayName?: string;
  betaActive: boolean;
  activationSource?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
};

export default function DemoAccountsAdmin() {
  const [accounts, setAccounts] = useState<DemoProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "clear" | "clearAll";
    uid?: string;
    email?: string;
    stripeCustomerId?: string;
  }>({ open: false, type: "clear" });

  async function load() {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const res = await fetch("/api/admin/demo-accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch demo accounts");
      }
      
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (e) {
      console.error("Failed to load demo accounts", e);
      toast.error("Failed to load demo accounts");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(uid: string, active: boolean) {
    setBusyUid(uid);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const res = await fetch("/api/admin/toggle-demo", {
        method: "POST",
        body: JSON.stringify({ uid, active }),
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to toggle demo status");
      }

      toast.success(`Account ${active ? 'activated' : 'deactivated'}`);
      await load();
    } catch (e) {
      console.error("Toggle error:", e);
      toast.error("Failed to update account");
    } finally {
      setBusyUid(null);
    }
  }

  async function reseed(uid: string) {
    setBusyUid(uid);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const res = await fetch("/api/seed-demo", {
        method: "POST",
        body: JSON.stringify({ uid }),
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to reseed account");
      }

      const data = await res.json();
      toast.success("Demo account reseeded successfully!");
      
      if (data.invoiceUrl) {
        toast.info("Test invoice created in Stripe");
      }
      
      await load();
    } catch (e) {
      console.error("Reseed error:", e);
      toast.error("Failed to reseed account");
    } finally {
      setBusyUid(null);
    }
  }

  async function clearDemo(uid: string, stripeCustomerId?: string) {
    setBusyUid(uid);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const res = await fetch("/api/admin/clear-demo", {
        method: "POST",
        body: JSON.stringify({ uid, stripeCustomerId }),
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to clear demo data");
      }

      const data = await res.json();
      const counts = data.cleared;
      toast.success(
        `Cleared: ${counts.soapNotes} notes, ${counts.patientSessions} sessions, ${counts.storageFiles} files`
      );
      
      await load();
    } catch (e) {
      console.error("Clear demo error:", e);
      toast.error("Failed to clear demo data");
    } finally {
      setBusyUid(null);
      setConfirmModal({ open: false, type: "clear" });
    }
  }

  async function clearAllDemos() {
    setBusyUid("all");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const res = await fetch("/api/admin/clear-all-demos", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to clear all demo accounts");
      }

      const data = await res.json();
      toast.success(`Cleared ${data.clearedAccounts} demo accounts`);
      
      await load();
    } catch (e) {
      console.error("Clear all error:", e);
      toast.error("Failed to clear all demo accounts");
    } finally {
      setBusyUid(null);
      setConfirmModal({ open: false, type: "clearAll" });
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Demo Accounts</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmModal({ open: true, type: "clearAll" })}
            disabled={busyUid === "all" || accounts.length === 0}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {busyUid === "all" ? "Clearing..." : "Clear All Demo Accounts"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading demo accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No demo accounts found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2">Email</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Stripe Customer</th>
                <th className="pb-2">Subscription</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.uid} className="border-t">
                  <td className="py-3">
                    <div>
                      <div className="font-medium">{a.email}</div>
                      {a.displayName && (
                        <div className="text-xs text-gray-500">{a.displayName}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    {a.betaActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-xs">{a.stripeCustomerId || "-"}</td>
                  <td className="py-3 font-mono text-xs">{a.stripeSubscriptionId || "-"}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => toggle(a.uid, !a.betaActive)}
                        disabled={busyUid === a.uid}
                      >
                        {busyUid === a.uid ? "..." : (a.betaActive ? "Deactivate" : "Activate")}
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => reseed(a.uid)}
                        disabled={busyUid === a.uid}
                      >
                        {busyUid === a.uid ? "..." : "Reseed"}
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setConfirmModal({ 
                          open: true, 
                          type: "clear", 
                          uid: a.uid, 
                          email: a.email,
                          stripeCustomerId: a.stripeCustomerId 
                        })}
                        disabled={busyUid === a.uid}
                      >
                        {busyUid === a.uid ? "..." : "Clear"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        open={confirmModal.open && confirmModal.type === "clear"}
        title="Clear Demo Data"
        description={`This will permanently delete all data for ${confirmModal.email || "this account"}:
• SOAP notes
• Patient sessions  
• PDF files
• Stripe test invoices

The account will be reset to inactive state. Are you sure?`}
        confirmText="Yes, Clear Data"
        cancelText="Cancel"
        onConfirm={() => confirmModal.uid && clearDemo(confirmModal.uid, confirmModal.stripeCustomerId)}
        onCancel={() => setConfirmModal({ open: false, type: "clear" })}
        loading={busyUid === confirmModal.uid}
      />

      <ConfirmModal
        open={confirmModal.open && confirmModal.type === "clearAll"}
        title="Clear All Demo Accounts"
        description={`This will permanently delete ALL data for ${accounts.length} demo accounts:
• All SOAP notes
• All patient sessions
• All PDF files  
• All Stripe test invoices

All accounts will be reset to inactive state. Are you absolutely sure?`}
        confirmText="Yes, Clear All"
        cancelText="Cancel"
        variant="danger"
        onConfirm={clearAllDemos}
        onCancel={() => setConfirmModal({ open: false, type: "clearAll" })}
        loading={busyUid === "all"}
      />
    </div>
  );
}
