"use client";
import { useEffect, useState } from "react";

type StripeInvoice = {
  id: string;
  number?: string | null;
  amount_due?: number;
  currency?: string;
  status?: string;
  hosted_invoice_url?: string | null;
  created?: number;
  [k: string]: any;
};

export default function useInvoices() {
  const [invoices, setInvoices] = useState<StripeInvoice[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/invoices", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch invoices");
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setError(err?.message || "Unknown error");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { invoices, loading, error, reload: load };
}
