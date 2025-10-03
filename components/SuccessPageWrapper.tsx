"use client";

import { Suspense } from "react";
import SuccessPageInner from "./SuccessPageInner";

export default function SuccessPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SuccessPageInner />
    </Suspense>
  );
}