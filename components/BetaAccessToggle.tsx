"use client";

import { useState } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";

interface BetaAccessToggleProps {
  uid: string;
  email?: string;
  currentBetaStatus: boolean;
}

export default function BetaAccessToggle({ 
  uid, 
  email, 
  currentBetaStatus 
}: BetaAccessToggleProps) {
  const currentProStatus = currentBetaStatus;
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setStatus(null);
    
    const endpoint = currentProStatus ? "/api/admin/clear-beta" : "/api/admin/demo-unlock";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to update access");
      }

      setStatus({
        type: 'success',
        message: currentProStatus 
          ? `Pro access removed for ${email || uid}` 
          : `Pro access granted to ${email || uid}`
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || "Failed to update access"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Toggle Switch */}
      <button
        disabled={loading}
        onClick={handleToggle}
        className="flex items-center gap-2.5 group disabled:opacity-60 disabled:cursor-not-allowed"
        title={currentProStatus ? "Revoke Pro access" : "Grant Pro access"}
      >
        <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          currentProStatus ? "bg-emerald-500" : "bg-gray-300"
        }`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            currentProStatus ? "translate-x-4" : "translate-x-0"
          }`}>
            {loading && (
              <Loader2 className="h-3 w-3 animate-spin text-gray-400 absolute top-0.5 left-0.5" />
            )}
          </div>
        </div>
        <span className={`text-xs font-medium ${
          currentProStatus ? "text-emerald-700" : "text-gray-500"
        }`}>
          {loading
            ? "Updating..."
            : currentProStatus
            ? "Pro Active"
            : "Free Tier"}
        </span>
      </button>

      {status && (
        <div className={`flex items-center gap-1.5 text-xs ${
          status.type === 'success' 
            ? 'text-emerald-700' 
            : 'text-red-600'
        }`}>
          {status.type === 'success' ? (
            <Check className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}