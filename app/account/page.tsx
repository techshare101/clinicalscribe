"use client";

import { SubscriptionPlan } from "@/components/subscription-plan";

export const dynamic = 'force-dynamic';

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-gray-600">
          Manage your account preferences, security settings, and subscription
          details
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[240px,1fr]">
        <nav className="space-y-1">
          <a
            href="#profile"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Profile
          </a>
          <a
            href="#subscription"
            className="flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900"
          >
            Subscription
          </a>
          <a
            href="#security"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Security
          </a>
          <a
            href="#notifications"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Notifications
          </a>
        </nav>

        <main>
          <div id="subscription" className="space-y-6">
            <div>
              <h2 className="text-lg font-medium">Subscription Plan</h2>
              <p className="text-sm text-gray-500">
                Manage your subscription and billing information
              </p>
            </div>
            <SubscriptionPlan />
          </div>
        </main>
      </div>
    </div>
  );
}
