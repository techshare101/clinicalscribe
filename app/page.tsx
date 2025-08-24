import { Suspense } from "react";
import LandingPageClient from "@/components/LandingPageClient";
import StaticLandingPage from "@/components/StaticLandingPage";

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* Static content that loads immediately (SEO-friendly) */}
      <StaticLandingPage />
      
      {/* Client-side features wrapped in Suspense */}
      <Suspense fallback={
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Loading...
          </div>
        </div>
      }>
        <LandingPageClient />
      </Suspense>
    </div>
  );
}