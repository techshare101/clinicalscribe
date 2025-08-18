"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const params = useSearchParams();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Query param <code>foo</code>: {params.get("foo") ?? "none"}
      </p>
      {/* Place your dashboard components here once build is green */}
    </main>
  );
}
