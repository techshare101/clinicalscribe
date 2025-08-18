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
