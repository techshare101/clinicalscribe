"use client";

import { useState } from "react";
import { Zap, Lock, Check, AlertCircle } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setStatus(null);
    
    const endpoint = currentBetaStatus ? "/api/admin/clear-beta" : "/api/admin/demo-unlock";
    const action = currentBetaStatus ? "revoked" : "unlocked";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} beta access`);
      }

      setStatus({
        type: 'success',
        message: currentBetaStatus 
          ? `⚡ Beta access revoked for ${email || uid}` 
          : `✅ Beta access unlocked for ${email || uid}`
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

  return (
    <div className="space-y-2">
      <button
        disabled={loading}
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${
          currentBetaStatus
            ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        }`}
      >
        {currentBetaStatus ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        <span className="font-medium">
          {loading 
            ? (currentBetaStatus ? "Revoking..." : "Unlocking...") 
            : (currentBetaStatus ? "Revoke Beta" : "Unlock Beta")
          }
        </span>
      </button>
      
      {/* Current Status Indicator */}
      <div className={`flex items-center gap-1.5 text-xs ${
        currentBetaStatus ? "text-green-600" : "text-gray-500"
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          currentBetaStatus ? "bg-green-500" : "bg-gray-400"
        }`} />
        <span>Currently: {currentBetaStatus ? "Pro Active" : "Free Tier"}</span>
      </div>
      
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