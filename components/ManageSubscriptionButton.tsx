"use client";
import React, { useState } from "react";

export default function ManageSubscriptionButton({
  className,
  children = "Manage Subscription",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  async function handleManage() {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/manage", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not open Stripe portal");
      if (data.url) {
        // redirect to Stripe portal
        window.location.href = data.url;
      } else {
        throw new Error("Portal URL not returned");
      }
    } catch (err: any) {
      console.error("Manage subscription error", err);
      // Simple toast fallback (replace with your toast system)
      alert(err?.message || "Failed to open billing portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className={className || "px-4 py-2 rounded bg-emerald-600 text-white"}
    >
      {loading ? "Opening portal…" : children}
    </button>
  );
}
