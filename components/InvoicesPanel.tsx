"use client";
import React from "react";
import useInvoices from "@/hooks/useInvoices";

export default function InvoicesPanel() {
  const { invoices, loading, error, reload } = useInvoices();

  if (loading) return <div>Loading invoices…</div>;
  if (error) return <div>Error loading invoices: {error}</div>;

  if (!invoices || invoices.length === 0) {
    return (
      <div className="p-4 rounded border">
        <p>No invoices available yet. Once you subscribe, invoices will appear here.</p>
        <button onClick={reload} className="mt-3 px-3 py-1 border rounded">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded border">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th>Invoice</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const date = inv.created ? new Date(inv.created * 1000).toLocaleDateString() : "-";
            const amount =
              typeof inv.amount_due === "number"
                ? `${(inv.amount_due / 100).toFixed(2)} ${inv.currency?.toUpperCase() || ""}`
                : "-";
            return (
              <tr key={inv.id} className="border-t">
                <td>{inv.number || inv.id}</td>
                <td>{date}</td>
                <td>{amount}</td>
                <td>{inv.status}</td>
                <td>
                  {inv.hosted_invoice_url ? (
                    <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" className="underline">
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}