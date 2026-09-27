"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface HealthStatus {
  status: "healthy" | "degraded";
  services: {
    firebase: string;
    stripe: string;
    epic: string;
  };
  timestamp: string;
}

export default function HealthcheckWidget() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthcheck = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/healthcheck");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch healthcheck:", err);
      setStatus({
        status: "degraded",
        services: {
          firebase: "error",
          stripe: "error",
          epic: "error"
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthcheck();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthcheck, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatusBadge = ({ value, label }: { value: string; label: string }) => {
    if (value === "ok") {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
            <p className="text-xs text-green-600 dark:text-green-400">Operational</p>
          </div>
        </div>
      );
    } else if (value === "not-configured") {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Not Configured</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <XCircle className="h-5 w-5 text-red-600" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-xs text-red-600 dark:text-red-400">Error</p>
        </div>
      </div>
    );
  };

  if (loading && !status) {
    return (
      <div className="bg-white dark:bg-gray-800/50 rounded-lg p-6 shadow-sm dark:border dark:border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-gray-300"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Checking system health...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:border dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            status?.status === "healthy"
              ? "bg-green-100 dark:bg-green-900/40"
              : "bg-red-100 dark:bg-red-900/40"
          }`}>
            {status?.status === "healthy" ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              System Health
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Status: {status?.status === "healthy" ? "All systems operational" : "Degraded performance"}
            </p>
          </div>
        </div>
        <button
          onClick={fetchHealthcheck}
          disabled={refreshing}
          className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
          title="Refresh status"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <StatusBadge value={status?.services.firebase || "error"} label="Firebase" />
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <StatusBadge value={status?.services.stripe || "error"} label="Stripe" />
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <StatusBadge value={status?.services.epic || "error"} label="Epic SMART" />
        </div>
      </div>

      {status?.timestamp && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Last checked: {new Date(status.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}