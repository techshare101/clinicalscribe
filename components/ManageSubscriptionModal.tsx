"use client";
import React from "react";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import InvoicesPanel from "@/components/InvoicesPanel";

export default function ManageSubscriptionModal() {
  return (
    <div className="p-6 rounded-xl border bg-white/70 shadow-sm backdrop-blur-lg">
      <h2 className="text-lg font-semibold mb-4">Subscription Management</h2>

      {/* Manage + Cancel (portal) */}
      <div className="flex items-center gap-3 mb-6">
        <ManageSubscriptionButton className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700" />
        <span className="text-sm text-gray-600">
          Use the portal to update billing, view or cancel your subscription.
        </span>
      </div>

      {/* Invoices */}
      <h3 className="text-md font-medium mb-2">Invoices</h3>
      <InvoicesPanel />
    </div>
  );
}