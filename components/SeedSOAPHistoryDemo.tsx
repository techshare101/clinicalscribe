"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function SeedSOAPHistoryDemo() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const seedSOAPDemo = async () => {
    if (!user) {
      setMessage("You must be logged in to seed demo data");
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus("idle");
    
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/seed-soap-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to seed demo data");
      }

      setStatus("success");
      setMessage(data.message || "Demo data seeded successfully!");
    } catch (error: any) {
      console.error("Error seeding demo:", error);
      setStatus("error");
      setMessage(error.message || "Failed to seed demo data");
    } finally {
      setLoading(false);
    }
  };

  const resetStatus = () => {
    setStatus("idle");
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">SOAP History Demo Data</h3>
            <p className="text-sm text-blue-700 mt-1">
              Seed your SOAP History page with sample patient notes for training and demonstrations.
            </p>
            <p className="text-sm text-blue-600 mt-2">
              This will create 3 demo SOAP notes with different statuses:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-600 mt-1 ml-4">
              <li>1 flagged note (red flag)</li>
              <li>1 standard note</li>
              <li>1 note with PDF ready</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={seedSOAPDemo}
          disabled={loading}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
            ${loading 
              ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Seeding Demo Data...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              Seed SOAP Demo Data
            </>
          )}
        </motion.button>

        {status === "success" && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={resetStatus}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Seed Again
          </motion.button>
        )}
      </div>

      {/* Status Messages */}
      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            rounded-lg p-4 flex items-start gap-3
            ${status === "success" 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
            }
          `}
        >
          {status === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-medium ${
              status === "success" ? "text-green-900" : "text-red-900"
            }`}>
              {status === "success" ? "Success!" : "Error"}
            </p>
            <p className={`text-sm ${
              status === "success" ? "text-green-700" : "text-red-700"
            }`}>
              {message}
            </p>
            {status === "success" && (
              <p className="text-sm text-green-600 mt-2">
                Navigate to the <a href="/soap-history" className="font-semibold underline">SOAP History</a> page to view the demo data.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">About Demo Data</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• Demo notes are added to your SOAP History</li>
          <li>• They appear alongside any real notes you create</li>
          <li>• You can delete them individually from the SOAP History page</li>
          <li>• Running this multiple times will create additional demo notes</li>
        </ul>
      </div>
    </div>
  );
}