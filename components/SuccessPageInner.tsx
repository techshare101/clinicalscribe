"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CheckCircle, ArrowRight, Sparkles, Gift, Users, FileText, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SuccessPageInner() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [betaActivated, setBetaActivated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [autoRedirect, setAutoRedirect] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Safely get search params on client side only
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
      // Check if auto-redirect is requested via URL parameter
      const autoParam = params.get("auto");
      if (autoParam === "1") {
        setAutoRedirect(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let unsubAuth: () => void;
    let unsubFirestore: () => void;
    let countdownTimer: NodeJS.Timeout;

    console.log("🎉 Success page loaded - checking user status");

    // Listen for authentication and check beta status (but don't auto-redirect)
    unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        console.log("✅ User authenticated:", user.email);
        
        const profileRef = doc(db, "profiles", user.uid);
        unsubFirestore = onSnapshot(profileRef, (snap) => {
          const data = snap.data();
          console.log("📊 Profile data:", data);
          
          if (data?.betaActive || data?.subscriptionStatus === "active") {
            console.log("🔥 Beta access confirmed!");
            setBetaActivated(true);
          }
        });
      }
    });

    // Only auto-redirect if explicitly requested
    if (autoRedirect) {
      let count = 5;
      countdownTimer = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countdownTimer);
          router.push("/dashboard?checkout=success&activated=true");
        }
      }, 1000);
    }

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubFirestore) unsubFirestore();
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [router, autoRedirect, mounted]);

  // Manual navigation handler
  const handleGoToDashboard = () => {
    const params = betaActivated ? "?checkout=success&activated=true" : "?checkout=success&pending=true";
    router.push(`/dashboard${params}`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-8 relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-xl">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="h-10 w-10 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-5 w-5 text-yellow-800" />
              </div>
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Payment Confirmed!
          </CardTitle>
          <CardDescription className="text-xl text-gray-600">
            Thank you for supporting ClinicalScribe Beta
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Welcome Message */}
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900">
                Welcome to the Future of Clinical Documentation!
              </h3>
              <p className="text-lg text-gray-600 max-w-lg mx-auto">
                Your Beta access is being activated. You now have access to our premium AI-powered 
                SOAP note generation and advanced clinical features.
              </p>
            </div>
            
            {betaActivated && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-6 py-2 text-lg">
                ✨ Beta Access Activated
              </Badge>
            )}
            
            {userEmail && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-700">
                  📧 Confirmation email sent to <span className="font-medium">{userEmail}</span>
                </p>
              </div>
            )}
          </div>

          {/* Features Unlocked */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
            <h4 className="font-bold text-blue-900 mb-6 text-center text-xl">🚀 What You've Unlocked</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 text-blue-800">
                <FileText className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Unlimited SOAP Notes</div>
                  <div className="text-sm">AI-powered clinical documentation</div>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-blue-800">
                <Users className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">EHR Integration</div>
                  <div className="text-sm">Seamless export to major systems</div>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-blue-800">
                <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">HIPAA Compliance</div>
                  <div className="text-sm">Enterprise-grade security</div>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-blue-800">
                <Sparkles className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Priority Support</div>
                  <div className="text-sm">Beta features & direct feedback</div>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-redirect Notice (only if enabled) */}
          {autoRedirect && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Auto-redirecting to dashboard in <span className="font-bold text-emerald-600 text-lg">{countdown}s</span>
              </p>
              <p className="text-xs text-gray-500">
                Add ?auto=1 to the success URL to enable this feature
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={handleGoToDashboard}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-lg py-6 shadow-xl"
              size="lg"
            >
              <ArrowRight className="mr-3 h-6 w-6" />
              Start Using ClinicalScribe
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="text-sm py-3"
                onClick={() => router.push("/help/getting-started")}
              >
                Getting Started Guide
              </Button>
              <Button 
                variant="outline" 
                className="text-sm py-3"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="text-sm py-3"
                onClick={() => router.push("/support")}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}