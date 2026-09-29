import { toast as shadcnToast } from "@/hooks/use-toast";

export type ToastVariant = "success" | "error" | "info";
export type ToastPayload = { id?: string; title?: string; message: string; variant?: ToastVariant };

export function toast(payload: ToastPayload | string) {
  const detail = typeof payload === "string" ? { message: payload } : payload;
  const isError = detail.variant === "error";

  shadcnToast({
    title: detail.title || (detail.variant === "success" || detail.message.toLowerCase().includes("copied") ? "Copied" : isError ? "Error" : undefined),
    description: detail.message,
    variant: isError ? "destructive" : "default",
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("toast", { detail }));
  }
}
