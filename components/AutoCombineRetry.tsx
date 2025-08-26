'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AutoCombineRetryProps {
  sessionId: string;
  onSuccess?: () => void;
}

export default function AutoCombineRetry({ 
  sessionId,
  onSuccess
}: AutoCombineRetryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRetry = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Call the SOAP combine API
      const response = await fetch('/api/soap/combine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId,
          isAutoCombine: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to combine recordings');
      }
      
      // Success!
      setSuccess(true);
      onSuccess?.();
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error retrying auto-combine:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry auto-combine');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-sm">
        <p className="text-sm text-green-800 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-green-500 animate-spin" />
          SOAP note successfully generated! Refreshing page...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-red-800 font-medium">
            Auto-combine failed. The session has over 120 minutes of recordings but no SOAP note was generated.
          </p>
          {error && (
            <p className="text-xs text-red-700 mt-1">
              Error: {error}
            </p>
          )}
          <button
            onClick={handleRetry}
            disabled={loading}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Retry Auto-Combine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}