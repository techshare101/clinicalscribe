"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { InvoiceDialog } from "./invoice-dialog";
import { toast } from "sonner";

interface SubscriptionPlanProps {
  className?: string;
}

export function SubscriptionPlan({ className }: SubscriptionPlanProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [invoices, setInvoices] = React.useState([]);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = React.useState(false);

  // Handle redirect to Stripe Portal
  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load billing portal");
      }

      // Redirect to Stripe Billing Portal
      window.location.href = data.url;
    } catch (error) {
      console.error("Error accessing billing portal:", error);
      toast.error("Failed to open billing portal. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle fetching and displaying invoices
  const handleViewInvoices = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invoices");
      }

      setInvoices(data.invoices);
      setIsInvoiceDialogOpen(true);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="rounded-lg border border-green-100 bg-green-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">ClinicalScribe Pro</h3>
            <p className="text-sm text-gray-600">Beta Access + Unlimited Usage</p>
          </div>
          <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white">
            Active
          </span>
        </div>

        <div className="mt-6">
          <h4 className="font-medium">Features Included</h4>
          <ul className="mt-2 space-y-2">
            <li className="flex items-center text-sm text-gray-600">
              <CheckIcon className="mr-2 h-4 w-4" />
              Unlimited SOAP Notes
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckIcon className="mr-2 h-4 w-4" />
              Real-time Transcription
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckIcon className="mr-2 h-4 w-4" />
              EHR Integration
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckIcon className="mr-2 h-4 w-4" />
              Priority Support
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <h4 className="font-medium">Billing Information</h4>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Status</dt>
              <dd className="text-sm font-medium text-green-600">Active</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Next Billing</dt>
              <dd className="text-sm font-medium">N/A (Beta)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Amount</dt>
              <dd className="text-sm font-medium">$0.00</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Manage Subscription
          </button>
          <button
            onClick={handleViewInvoices}
            disabled={isLoading}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            View Invoices
          </button>
        </div>
      </div>

      <InvoiceDialog
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        invoices={invoices}
      />
    </div>
  );
}

function CheckIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}