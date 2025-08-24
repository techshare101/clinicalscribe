"use client";

import { Suspense } from "react";
import HomePageClientInner from "./HomePageClientInner";

export default function HomePageClientWrapper() {
  return (
    <Suspense fallback={null}>
      <HomePageClientInner />
    </Suspense>
  );
}