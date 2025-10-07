"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function DownloadPdfButton({ pdfPath }: { pdfPath: string }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  async function handleClick() {
    if (!user) {
      alert("Please log in to download PDFs");
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const res = await fetch("/api/pdf/get-url", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ filePath: pdfPath }),
      });
      
      const data = await res.json();
      
      if (data.success && data.url) {
        window.open(data.url, "_blank");
      } else {
        console.error("Failed to fetch download link:", data.error);
        alert(data.error || "Failed to fetch download link");
      }
    } catch (e) {
      console.error("Could not generate download link.", e);
      alert("Download failed. Please try again.");
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
