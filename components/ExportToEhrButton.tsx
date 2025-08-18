"use client";

import { useState } from "react";
import { exportReportToEHR } from "@/lib/ehr";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export function ExportToEhrButton({ reportId, disabled }: { reportId: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    try {
      setBusy(true);
      toast({ message: "Exporting to EHR…", variant: "info" });
      const res = await exportReportToEHR(reportId);
      if (res.ok) {
        await updateDoc(doc(db, "reports", reportId), {
          exportedEhr: true,
          exportedAt: new Date().toISOString(),
          exportResourceId: res.id,
        });
        toast({ message: `Exported to EHR (id: ${res.id})`, variant: "success" });
      } else {
        toast({ message: `EHR export failed (${res.status}): ${res.message ?? "See logs"}`, variant: "error" });
      }
    } catch (e) {
      console.error(e);
      toast({ message: "Unexpected error exporting to EHR", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="btn btn-secondary"
      disabled={busy || disabled}
      onClick={handleExport}
      title={disabled ? "Connect EHR to export" : "Export this report to EHR"}
    >
      {busy ? "Exporting…" : "Export to EHR"}
    </button>
  );
}
