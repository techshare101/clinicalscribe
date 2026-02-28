"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ViewPdfButtonProps {
  storagePath: string;
  variant?: "button" | "badge";
  className?: string;
}

/**
 * Fetches a fresh signed URL on-demand and opens the PDF.
 * Never relies on stored pdfUrl which can expire with 403.
 */
export function ViewPdfButton({ storagePath, variant = "button", className }: ViewPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;
    if (!storagePath) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();

      const res = await fetch("/api/pdf/get-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ filePath: storagePath }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        window.open(data.url, "_blank");
      } else {
        console.error("Failed to get PDF URL:", data.error);
      }
    } catch (err) {
      console.error("PDF view error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (variant === "badge") {
    return (
      <Badge
        onClick={handleClick}
        className={`cursor-pointer transition-colors ${className || "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <FileText className="h-3 w-3 mr-1" />
        )}
        {loading ? "Opening..." : "View PDF"}
      </Badge>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={className || "bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        <ExternalLink className="h-3 w-3 mr-1" />
      )}
      {loading ? "Opening..." : "View PDF"}
    </Button>
  );
}
