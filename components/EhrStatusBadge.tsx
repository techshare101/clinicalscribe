"use client";

import { useEffect, useState } from "react";

export function EhrStatusBadge() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/smart/status", { cache: "no-store" });
        const data = await res.json();
        if (alive) setConnected(Boolean(data?.connected));
      } catch {
        if (alive) setConnected(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const cls = connected
    ? "bg-green-100 text-green-800"
    : connected === false
    ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-800";

  const text = connected === null ? "Checking EHR…" : connected ? "EHR Connected" : "EHR Disconnected";

  return <span className={`px-2 py-1 rounded text-xs ${cls}`}>{text}</span>;
}
