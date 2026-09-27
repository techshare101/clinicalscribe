"use client";

import { Suspense } from "react";
import SettingsPageInner from "./SettingsPageInner";

export default function SettingsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400" />
      </div>
    }>
      <SettingsPageInner />
    </Suspense>
  );
}