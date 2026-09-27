"use client";
import { motion } from "framer-motion";
import { Shield, Key, RefreshCw, FileText, Link2, CheckCircle } from "lucide-react";

export default function ConnectionLifecycle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-2xl" />

      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
          <Link2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        </span>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Connection Lifecycle</h3>
      </div>

      <div className="space-y-2">
        {[
          { text: <>Nurse clicks <span className="font-semibold text-gray-900 dark:text-gray-100">Connect to EHR</span>.</> },
          { text: 'Epic login page opens — nurse enters credentials (with MFA if required).' },
          { text: <>Epic redirects back with an <code className="px-1 py-0.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 rounded text-xs font-mono">authorization code</code>.</> },
          { text: <>ClinicalScribe exchanges the code for <span className="font-semibold text-gray-900 dark:text-gray-100">Access + Refresh Tokens</span>.</> },
          { text: <>Tokens stored securely in <span className="font-semibold text-gray-900 dark:text-gray-100">httpOnly cookies</span>.</> },
          { text: <>Dashboard shows <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Connected to Epic</span>.</> },
          { text: <>SOAP Note PDF exported into Epic as <code className="px-1 py-0.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 rounded text-xs font-mono">DocumentReference</code>.</> },
          { text: <>Tokens expire — <span className="font-semibold text-gray-900 dark:text-gray-100">SMART Status API</span> auto-refreshes silently using the refresh token.</> },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 rounded-full text-[10px] font-bold mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</span>
          </div>
        ))}
      </div>

      {/* Why It Matters */}
      <div className="mt-5 p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/20 dark:bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <p className="relative text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-3 flex items-center gap-2">
          <span className="p-1 bg-indigo-100 dark:bg-indigo-900/60 rounded-md">
            <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </span>
          Why it matters
        </p>
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-start gap-2.5 p-2.5 bg-white/70 dark:bg-gray-800/50 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30">
            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-md flex-shrink-0 mt-0.5">
              <Key className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-bold text-emerald-700 dark:text-emerald-400">HIPAA-friendly</span> — tokens never exposed to client-side JS.</span>
          </div>
          <div className="flex items-start gap-2.5 p-2.5 bg-white/70 dark:bg-gray-800/50 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
            <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-md flex-shrink-0 mt-0.5">
              <RefreshCw className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-bold text-blue-700 dark:text-blue-400">OAuth2-compliant</span> — refresh tokens extend session securely.</span>
          </div>
          <div className="flex items-start gap-2.5 p-2.5 bg-white/70 dark:bg-gray-800/50 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
            <div className="p-1 bg-purple-100 dark:bg-purple-900/50 rounded-md flex-shrink-0 mt-0.5">
              <CheckCircle className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-bold text-purple-700 dark:text-purple-400">Nurse-friendly</span> — no repeated logins during a shift.</span>
          </div>
          <div className="flex items-start gap-2.5 p-2.5 bg-white/70 dark:bg-gray-800/50 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
            <div className="p-1 bg-amber-100 dark:bg-amber-900/50 rounded-md flex-shrink-0 mt-0.5">
              <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-bold text-amber-700 dark:text-amber-400">Enterprise-ready</span> — exactly how Epic SMART on FHIR expects apps to behave.</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}