"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithCustomToken, signOut } from "firebase/auth";

export default function DevLogin() {
  if (process.env.NODE_ENV !== "development") return null;

  const [expanded, setExpanded] = useState(false);
  const [uid, setUid] = useState("");
  const [idToken, setIdToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState<string>("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!expanded) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [expanded]);

  useEffect(() => {
    if (expanded) {
      // Focus the UID input when panel opens to allow immediate typing/paste
      inputRef.current?.focus();
    }
  }, [expanded]);

  async function handleLogin() {
    if (!uid) {
      setError("Please enter a UID");
      return;
    }
    setError("");
    setHint("");
    setLoading(true);
    try {
      const res = await fetch("/api/dev/mint-id-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Mint failed: ${res.status} ${txt}`);
      }
      const { customToken } = await res.json();

      await signInWithCustomToken(auth, customToken);
      const token = await auth.currentUser?.getIdToken();
      setIdToken(token || "");
    } catch (err: any) {
      const code = err?.code || "";
      const msg = err?.message || String(err);
      setError(msg);
      if (code === "auth/network-request-failed" || /network.*failed/i.test(msg)) {
        setHint(
          [
            "Troubleshooting:",
            "• Check your internet connection and retry.",
            "• Disable ad blockers/tracking protection for localhost (they can block identitytoolkit.googleapis.com).",
            "• Ensure the system clock is accurate (SSL).",
            "• Confirm .env.local NEXT_PUBLIC_FIREBASE_* are set and you restarted the dev server.",
            "• In Firebase Console > Authentication > Settings > Authorized domains, ensure 'localhost' is present.",
          ].join("\n")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <div className="relative ml-2" ref={panelRef}>
      <button
        type="button"
        className="text-xs px-2 py-1 rounded border border-dashed border-amber-400 text-amber-600 hover:bg-amber-50"
        onClick={() => setExpanded((x) => !x)}
        title="Development-only login"
      >
        Dev Login
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 p-3 border rounded bg-white shadow-md text-sm w-80 z-[99]">
          <h3 className="font-bold mb-2">Mint &amp; Sign In (DEV)</h3>
          <input
            ref={inputRef}
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Enter UID"
            className="border p-1 w-full mb-2 text-black rounded"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-blue-500 text-white px-3 py-1 rounded w-full mb-2 disabled:opacity-60"
            type="button"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          {idToken && (
            <div>
              <textarea
                readOnly
                value={idToken}
                className="w-full h-24 text-xs mb-1 border rounded p-1 bg-gray-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(idToken)}
                className="bg-green-500 text-white px-2 py-1 rounded mb-2"
                type="button"
              >
                Copy Token
              </button>
            </div>
          )}
          {error && <p className="text-red-500 whitespace-pre-wrap">{error}</p>}
          {hint && (
            <pre className="text-xs bg-amber-50 p-2 rounded border border-amber-200 whitespace-pre-wrap">{hint}</pre>
          )}
          <button
            onClick={handleSignOut}
            className="bg-gray-400 text-white px-3 py-1 rounded w-full"
            type="button"
          >
            Sign out
          </button>
          <p className="text-xs mt-1 text-gray-600">NODE_ENV: development</p>
        </div>
      )}
    </div>
  );
}
