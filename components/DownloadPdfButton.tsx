"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";

import { Loader2 } from "lucide-react";

export function DownloadPdfButton({ pdfPath }: { pdfPath: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    try {
      setLoading(true);
      const user = auth.currentUser;
      const idToken = await user?.getIdToken();
      if (!idToken) {
        // Fallback: prompt sign-in
        console.warn("Please sign in to download.");
        return;
      }
      const res = await fetch("/api/storage/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ path: pdfPath, expiresInSec: 300 }),
      });
      const { url, error } = await res.json();
      if (error || !url) throw new Error(error || "No URL returned");
      window.open(url, "_blank");
    } catch (e) {
      console.error("Could not generate download link.", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={!pdfPath || loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…
        </>
      ) : (
        "Download PDF"
      )}
    </Button>
  );
}
