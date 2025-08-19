"use client";

import { useState } from "react";
import { exportReportToEHR } from "@/lib/ehr";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

export function ExportToEhrButton({ reportId, disabled }: { reportId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleExport() {
    try {
      setLoading(true);
      toast({ title: "📤 Exporting...", description: `Report ${reportId}` , duration: 1500 });
      const res = await exportReportToEHR(reportId);

      if (res.ok) {
        await updateDoc(doc(db, "reports", reportId), {
          exportedEhr: true,
          exportedAt: new Date().toISOString(),
          exportResourceId: res.id,
        });
        toast({ title: "✅ Export Successful", description: `Epic ID: ${res.id || "Unknown"}`, duration: 4000 });
      } else if (res.status === 401) {
        toast({
          title: "🔑 Token Expired",
          description: "Epic says the OAuth token is invalid or expired.",
          variant: "destructive",
          duration: 6000,
          action: (
            <ToastAction altText="Retry" onClick={() => handleExport()}>Retry</ToastAction>
          ),
        });
      } else {
        toast({
          title: `❌ Export Failed (HTTP ${res.status})`,
          description: res.message || "Epic returned an error.",
          variant: "destructive",
          duration: 6000,
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "❌ Export Error", description: e?.message || "", variant: "destructive", duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
      disabled={loading || disabled}
      onClick={handleExport}
      title={disabled ? "Connect EHR to export" : "Export this report to EHR"}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}
      {loading ? "Exporting..." : "Export to EHR"}
    </button>
  );
}
