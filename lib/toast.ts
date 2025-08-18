// lib/toast.ts
export type ToastVariant = "success" | "error" | "info";
export type ToastPayload = { id?: string; title?: string; message: string; variant?: ToastVariant };

export function toast(payload: ToastPayload | string) {
  const detail = typeof payload === "string" ? { message: payload } : payload;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("toast", { detail }));
}
