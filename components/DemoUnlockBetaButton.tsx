"use client";

import { useState } from "react";
import { Zap, Check, AlertCircle } from "lucide-react";

interface DemoUnlockBetaButtonProps {
  uid: string;
  email?: string;
  currentBetaStatus?: boolean;
}

export default function DemoUnlockBetaButton({ 
  uid, 
  email, 
  currentBetaStatus = false 
}: DemoUnlockBetaButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setStatus(null);
    
    try {
      const res = await fetch("/api/admin/demo-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to unlock beta access");
      }

      setStatus({
        type: 'success',
        message: `✅ Beta access unlocked for ${email || uid}`
      });
      
      // Refresh the page after 2 seconds to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `❌ Failed: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (currentBetaStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        <span>Beta access already active</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        disabled={loading}
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Zap className="h-4 w-4" />
        <span className="font-medium">
          {loading ? "Unlocking..." : "Demo Unlock Beta"}
        </span>
      </button>
      
      {status && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
          status.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {status.type === 'success' ? (
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}