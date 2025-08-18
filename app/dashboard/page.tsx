"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600 mt-2">This is a minimal client-only dashboard placeholder.</p>
    </main>
  );
}
