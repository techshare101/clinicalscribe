// lib/ehr.ts
export type ExportResult =
  | { ok: true; id: string; status: number }
  | { ok: false; status: number; message?: string };

export async function exportReportToEHR(reportId: string): Promise<ExportResult> {
  const res = await fetch("/api/smart/post-document-reference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId }),
  });
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: true, id: data.id ?? data.resourceId ?? "unknown", status: res.status };
  }
  let msg = "Export failed";
  try { msg = (await res.json())?.error ?? msg; } catch {}
  return { ok: false, status: res.status, message: msg };
}

export type EhrStatusResult = {
  connected: boolean;
  status?: number;
  message?: string;
  error?: string;
  wwwAuthenticate?: string | null;
  base?: string | null;
};

export async function checkEhrStatus(): Promise<EhrStatusResult> {
  try {
    const res = await fetch("/api/smart/status", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    // Normalize shape expected by UI
    return {
      connected: !!data.connected,
      status: data.status ?? res.status,
      message: data.message ?? data.error ?? undefined,
      error: data.error,
      wwwAuthenticate: data.wwwAuthenticate ?? null,
      base: data.base ?? null,
    };
  } catch (e: any) {
    return {
      connected: false,
      status: undefined,
      message: e?.message || "Failed to check EHR status",
      error: e?.message,
      wwwAuthenticate: null,
      base: null,
    };
  }
}
