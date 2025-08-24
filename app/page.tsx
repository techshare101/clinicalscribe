import { Suspense } from "react";
import LandingPageClientWrapper from "@/components/LandingPageClientWrapper";
import LandingPageContent from "@/components/LandingPageContent";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <LandingPageClientWrapper />
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading ClinicalScribe...</p>
            </div>
          </div>
        }
      >
        <LandingPageContent />
      </Suspense>
    </>
  );
}