"use client";
import { motion } from "framer-motion";
import { Shield, Key, RefreshCw, FileText } from "lucide-react";

export default function ConnectionLifecycle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-10 p-6 rounded-2xl shadow-xl border
                 bg-white/20 backdrop-blur-xl
                 border-white/30 text-gray-900 dark:text-gray-100"
    >
      <h2 className="text-xl font-bold mb-4 text-purple-600 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
        </svg>
        Connection Lifecycle
      </h2>

      <ol className="space-y-3 text-sm md:text-base list-decimal list-inside">
        <li>
          Nurse clicks <span className="font-medium">Connect to EHR</span>.
        </li>
        <li>
          Epic login page opens — nurse enters credentials (with MFA if required).
        </li>
        <li>
          Epic redirects back with an <code className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-sm">authorization code</code>.
        </li>
        <li>
          ClinicalScribe exchanges the code for{" "}
          <span className="font-medium">Access + Refresh Tokens</span>.
        </li>
        <li>
          Tokens stored securely in <span className="font-medium">httpOnly cookies</span>.
        </li>
        <li>Dashboard shows <span className="text-green-600 font-medium">✅ Connected to Epic</span>.</li>
        <li>
          SOAP Note PDF exported into Epic as{" "}
          <code className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-sm">DocumentReference</code>.
        </li>
        <li>
          Tokens expire → <span className="font-medium">SMART Status API</span>{" "}
          auto-refreshes silently using the refresh token.
        </li>
      </ol>

      <div className="mt-6 bg-gradient-to-r from-purple-500/30 to-indigo-500/30
                      rounded-xl p-4 text-sm text-gray-800 dark:text-gray-200 shadow-md">
        <p className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Why it matters:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li className="flex items-start gap-2">
            <Key className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><span className="font-medium">HIPAA-friendly</span> — tokens never exposed to client-side JS.</span>
          </li>
          <li className="flex items-start gap-2">
            <RefreshCw className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><span className="font-medium">OAuth2-compliant</span> — refresh tokens extend session securely.</span>
          </li>
          <li className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><span className="font-medium">Nurse-friendly</span> — no repeated logins during a shift.</span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><span className="font-medium">Enterprise-ready</span> — exactly how Epic SMART on FHIR expects apps to behave.</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}