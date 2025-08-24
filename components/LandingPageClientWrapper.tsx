"use client";

import { Suspense } from "react";
import LandingPageClientInner from "./LandingPageClientInner";

export default function LandingPageClientWrapper() {
  return (
    <Suspense fallback={null}>
      <LandingPageClientInner />
    </Suspense>
  );
}