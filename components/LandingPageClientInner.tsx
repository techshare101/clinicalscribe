"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LandingPageClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);

  // Handle authentication redirects
  useEffect(() => {
    const path = window.location.pathname;

    // Block auto-redirect if in Stripe checkout flow or payment-related pages
    const isCheckoutFlow =
      path === "/success" ||
      path === "/cancel" ||
      path.startsWith("/success") ||
      path.startsWith("/cancel") ||
      searchParams?.get("checkout") ||
      searchParams?.get("session_id") ||
      searchParams?.get("activated") ||
      searchParams?.get("pending");

    console.log("🔍 Auth redirect check:", { path, isCheckoutFlow, hasUser: !!user });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !isCheckoutFlow) {
        console.log("✅ Redirecting authenticated user to dashboard", { path, isCheckoutFlow });
        setUser(currentUser);
        router.push("/dashboard");
      } else if (currentUser && isCheckoutFlow) {
        console.log("🚫 Skipping redirect - user in checkout flow", { path, isCheckoutFlow });
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router, searchParams, user]);

  // Handle special URL parameters
  useEffect(() => {
    const ref = searchParams?.get("ref");
    const utm_source = searchParams?.get("utm_source");
    const utm_campaign = searchParams?.get("utm_campaign");

    // Track referrals or campaigns
    if (ref || utm_source || utm_campaign) {
      console.log("📊 Tracking landing page visit:", { ref, utm_source, utm_campaign });
      
      // Store in localStorage for analytics
      if (typeof window !== "undefined") {
        const trackingData = {
          ref,
          utm_source,
          utm_campaign,
          timestamp: new Date().toISOString(),
          path: window.location.pathname
        };
        localStorage.setItem("landing_tracking", JSON.stringify(trackingData));
      }
    }
  }, [searchParams]);

  // Show special messages based on URL parameters
  const showSpecialMessage = () => {
    const activated = searchParams?.get("activated");
    const pending = searchParams?.get("pending");
    const ref = searchParams?.get("ref");
    
    if (activated === "true") {
      return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 text-white px-6 py-3 rounded-2xl shadow-xl animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <span className="font-semibold">Payment successful! Your beta access is now active.</span>
          </div>
        </div>
      );
    }

    if (pending === "true") {
      return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="font-semibold">Processing your payment...</span>
          </div>
        </div>
      );
    }

    if (ref) {
      return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500 via-pink-600 to-rose-600 text-white px-6 py-3 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">👋</span>
            <span className="font-semibold">Welcome from {ref}! Enjoy exclusive beta access.</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // This component doesn't render visible content - it just handles client-side logic
  return (
    <>
      {showSpecialMessage()}
    </>
  );
}