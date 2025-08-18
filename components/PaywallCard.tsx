"use client";

export function PaywallCard() {
  return (
    <div className="rounded-xl border p-6 text-center shadow bg-white">
      <h2 className="text-xl font-semibold mb-2">Unlock Beta Access</h2>
      <p className="text-sm text-gray-600 mb-4">
        Get full access to PDF export, EHR integration, and analytics.
      </p>
      <a
        href="/checkout?plan=beta"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Unlock Beta — $29
      </a>
    </div>
  );
}
