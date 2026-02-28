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
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Training Tools</h2>
        <p className="text-sm text-gray-500 mt-1">
          Onboard new team members with sample patient data and guided workflows.
        </p>
      </div>

      {/* Seed SOAP Card */}
      <div className="rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-indigo-100 rounded-xl shrink-0">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Generate Sample SOAP Notes</h3>
            <p className="text-sm text-gray-500 mt-1">
              Create realistic sample patient notes so your team can explore SOAP History,
              practice exporting, and familiarize themselves with the workflow.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Flagged note
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                Standard note
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                PDF-ready note
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={seedSOAPDemo}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generate Sample Notes
                  </>
                )}
              </motion.button>

              {status === "success" && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={resetStatus}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate More
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 flex items-start gap-3 ${
            status === "success"
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {status === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-medium text-sm ${
              status === "success" ? "text-emerald-900" : "text-red-900"
            }`}>
              {status === "success" ? "Sample notes created" : "Something went wrong"}
            </p>
            <p className={`text-sm mt-0.5 ${
              status === "success" ? "text-emerald-700" : "text-red-700"
            }`}>
              {message}
            </p>
            {status === "success" && (
              <a
                href="/soap-history"
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 mt-2 underline underline-offset-2"
              >
                View in SOAP History &rarr;
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="rounded-xl border border-gray-200 p-5">
        <h4 className="font-medium text-gray-900 text-sm mb-3">How it works</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>Sample notes appear in your SOAP History alongside real records</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>Delete them individually when no longer needed</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>Run multiple times to create additional training data</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>Perfect for onboarding new nurses to ClinicalScribe</span>
          </div>
        </div>
      </div>
    </div>
  );
}