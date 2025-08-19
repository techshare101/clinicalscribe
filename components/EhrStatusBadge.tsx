"use client";

import { useEffect, useState } from "react";
import { checkEhrStatus } from "@/lib/ehr";
import { useToast } from "@/components/ui/use-toast";

export function EhrStatusBadge() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await checkEhrStatus();
      if (!alive) return;
      setStatusCode(res.status ?? null);
      if (res.connected) {
        setStatus("connected");
        setMessage(null);
      } else {
        setStatus("disconnected");
        setMessage(res.message || res.error || "Unknown error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const styles = {
    checking: "bg-gray-100 text-gray-800",
    connected: "bg-green-100 text-green-800",
    disconnected: "bg-yellow-100 text-yellow-800",
  } as const;

  const label =
    status === "checking"
      ? "Checking EHR…"
      : status === "connected"
      ? "EHR Connected"
      : "EHR Disconnected";

  function handleReconnect() {
    toast({
      title: "Reconnect to EHR",
      description: "Go to Admin to refresh the SMART token (Epic OAuth).",
      duration: 5000,
    });
    // Route to admin to manage token for now.
    if (typeof window !== "undefined") window.location.href = "/admin";
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <div className="relative group inline-block">
        <span className={`px-2 py-1 rounded text-xs ${styles[status]}`}>{label}</span>
        {status === "disconnected" && message && (
          <div className="absolute z-50 hidden group-hover:block mt-1 left-0 w-max max-w-xs px-3 py-2 bg-black text-white text-xs rounded shadow-lg">
            {statusCode ? `[${statusCode}] ` : ""}{message}
          </div>
        )}
      </div>

      {status === "disconnected" && statusCode === 401 && (
        <button
          type="button"
          onClick={handleReconnect}
          className="px-2 py-1 text-xs rounded border border-yellow-300 text-yellow-800 hover:bg-yellow-50"
          title="Reconnect to EHR"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
