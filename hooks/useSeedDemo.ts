"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export function useSeedDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const seedDemo = async () => {
    try {
      setLoading(true);
      
      // Get the current user's auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Please sign in to seed demo data");
        return null;
      }

      const response = await fetch("/api/seed-demo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to seed demo data");
      }

      const data = await response.json();
      setResult(data);
      
      toast.success("Demo subscription created! Refresh to see changes.");
      
      // Optional: auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      return data;
    } catch (err) {
      console.error("Error seeding demo:", err);
      toast.error(err instanceof Error ? err.message : "Failed to seed demo data");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { seedDemo, loading, result };
}