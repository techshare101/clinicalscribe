"use client"

import Link from "next/link"

const tiers = [
  {
    name: "Starter",
    priceMonthly: "$0",
    description: "For students and low-volume solo practitioners.",
    features: [
      "20 SOAP notes/month",
      "Multilingual transcription",
      "AI SOAP note generation",
      "PDF export with eSignature",
      "Interactive body map UI",
    ],
    cta: { label: "Get Started Free", href: "/auth/signup" },
  },
  {
    name: "Pro",
    priceMonthly: "$69",
    priceYearly: "$690",
    description: "For individual clinicians needing unlimited access.",
    features: [
      "Everything in Starter",
      "Unlimited SOAP notes",
      "AI Red Flag Detection",
      "SOAP History + Audit Trail",
      "Priority Support",
      "Offline mode",
    ],
    cta: { label: "Upgrade to Pro", href: "/checkout?plan=pro_monthly" },
    highlight: true,
  },
  {
    name: "Team / Clinic",
    priceMonthly: "$59/user",
    priceYearly: "$590/user",
    description: "For group practices and small/medium clinics.",
    features: [
      "Everything in Pro",
      "Centralized billing & admin controls",
      "Shared patient registry",
      "Team collaboration tools",
      "Dedicated account manager",
    ],
    cta: { label: "Contact Sales", href: "/contact" },
  },
  {
    name: "Enterprise",
    priceMonthly: "From $199/user",
    description: "For hospitals and large health networks.",
    features: [
      "Everything in Team",
      "Custom EHR/EMR integration",
      "On-premise deployment option",
      "Enterprise-grade compliance",
      "Custom onboarding & training",
      "SLA-backed uptime guarantees",
    ],
    cta: { label: "Contact Sales", href: "/contact" },
  },
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-4xl font-bold text-center">Pricing</h1>
      <p className="text-center mt-2 text-lg text-gray-500">
        Choose the plan that fits your clinic’s needs.
      </p>
      <div className="mt-12 grid gap-8 md:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-6 flex flex-col justify-between ${
              (tier as any).highlight ? "border-blue-500 shadow-lg" : "border-gray-200"
            }`}
          >
            <div>
              <h2 className="text-xl font-semibold">{tier.name}</h2>
              <p className="mt-2 text-gray-500">{tier.description}</p>
              <p className="mt-4 text-3xl font-bold">
                {tier.priceMonthly}
                <span className="text-base font-normal">/mo</span>
              </p>
              {(tier as any).priceYearly && (
                <p className="text-sm text-gray-500">or {(tier as any).priceYearly}/yr</p>
              )}
              <ul className="mt-6 space-y-2">
                {tier.features.map((f: string) => (
                  <li key={f} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={tier.cta.href}
              className={`mt-6 block rounded-md px-4 py-2 text-center font-medium ${
                (tier as any).highlight
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {tier.cta.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
