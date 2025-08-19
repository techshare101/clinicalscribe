"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getSignedUrlForPath } from "@/lib/storage";

export function DownloadPdfButton({ pdfPath }: { pdfPath: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    try {
      setLoading(true);
      const url = await getSignedUrlForPath(pdfPath);
      window.open(url, "_blank");
    } catch (e) {
      console.error("Could not generate download link.", e);
      alert("Download failed. Please ensure you are signed in.");
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
