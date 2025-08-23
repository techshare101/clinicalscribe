"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CheckCircle, Loader2, ArrowRight, Sparkles, Gift, Users, FileText, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SuccessPage() {
  const router = useRouter();
  const [betaActivated, setBetaActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(8); // 8 second auto-redirect
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let unsubAuth: () => void;
    let unsubFirestore: () => void;
    let countdownTimer: NodeJS.Timeout;
    let maxTimeoutTimer: NodeJS.Timeout;

    console.log("🎉 Success page loaded - starting activation check");

    // Listen for authentication and beta activation
    unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        console.log("✅ User authenticated:", user.email);
        
        const profileRef = doc(db, "profiles", user.uid);
        unsubFirestore = onSnapshot(profileRef, (snap) => {
          const data = snap.data();
          console.log("📊 Profile data:", data);
          
          if (data?.betaActive || data?.subscriptionStatus === "active") {
            console.log("🔥 Beta access confirmed! User can now access dashboard.");
            setBetaActivated(true);
            setLoading(false);
            
            // Start auto-redirect countdown if enabled
            if (autoRedirectEnabled) {
              let count = 8;
              setCountdown(count);
              countdownTimer = setInterval(() => {
                count--;
                setCountdown(count);
                if (count <= 0) {
                  clearInterval(countdownTimer);
                  router.push("/dashboard?checkout=success&activated=true");
                }
              }, 1000);
            }
          }
        });

        // Maximum timeout: redirect after 12 seconds even if webhook is slow
        maxTimeoutTimer = setTimeout(() => {
          if (!betaActivated) {
            console.warn("⏰ Webhook timeout - showing manual navigation option");
            setTimeoutReached(true);
            setLoading(false);
            setAutoRedirectEnabled(false);
          }
        }, 12000);
      } else {
        // No user, redirect to dashboard with success params
        router.push("/dashboard?checkout=success");
      }
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubFirestore) unsubFirestore();
      if (countdownTimer) clearInterval(countdownTimer);
      if (maxTimeoutTimer) clearTimeout(maxTimeoutTimer);
    };
  }, [router, autoRedirectEnabled, betaActivated, mounted]);

  // Manual navigation handlers
  const handleGoToDashboard = () => {
    const params = betaActivated ? "?checkout=success&activated=true" : "?checkout=success&pending=true";
    router.push(`/dashboard${params}`);
  };

  const handleDisableAutoRedirect = () => {
    setAutoRedirectEnabled(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Payment Successful!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            {loading ? "Activating your Beta access..." : "Welcome to ClinicalScribe Beta!"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {loading && !timeoutReached && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
              </div>
              <div className="space-y-3">
                <p className="text-gray-700 font-medium text-lg">
                  Setting up your account...
                </p>
                <p className="text-sm text-gray-500">
                  Payment confirmed • Activating features • Usually takes 3-5 seconds
                </p>
                {userEmail && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      📧 Confirmation email sent to <span className="font-medium">{userEmail}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {timeoutReached && !betaActivated && (
            <div className="text-center space-y-6">
              <div className="flex justify-center items-center space-x-3">
                <Gift className="h-8 w-8 text-orange-500" />
                <span className="text-xl font-semibold text-gray-800">Payment Confirmed!</span>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  Your payment was successful. We're finalizing your account activation.
                </p>
                <p className="text-sm text-gray-500">
                  You can continue to your dashboard while we complete the setup.
                </p>
              </div>
              
              <Button 
                onClick={handleGoToDashboard}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg"
                size="lg"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Continue to Dashboard
              </Button>
            </div>
          )}

          {betaActivated && (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="h-20 w-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="h-6 w-6 text-yellow-500 animate-bounce" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Welcome to ClinicalScribe Beta!
                  </h3>
                  <p className="text-gray-600">
                    Your account is fully activated and ready to transform your documentation workflow.
                  </p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-1">
                  ✨ Beta Access Activated
                </Badge>
              </div>

              {/* Features Highlight */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-4 text-center">🚀 What's Unlocked?</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-3 text-blue-800">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Unlimited AI-powered SOAP note generation</span>
                  </div>
                  <div className="flex items-center space-x-3 text-blue-800">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Premium EHR integration & export</span>
                  </div>
                  <div className="flex items-center space-x-3 text-blue-800">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Advanced privacy & HIPAA compliance</span>
                  </div>
                  <div className="flex items-center space-x-3 text-blue-800">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Priority support & beta features</span>
                  </div>
                </div>
              </div>

              {/* Auto-redirect Notice */}
              {autoRedirectEnabled && countdown > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Taking you to your dashboard in <span className="font-bold text-emerald-600 text-lg">{countdown}s</span>
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDisableAutoRedirect}
                    className="text-xs hover:bg-gray-100"
                  >
                    Stay Here
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleGoToDashboard}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
                  size="lg"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Start Using ClinicalScribe
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="text-sm"
                    onClick={() => router.push("/help/getting-started")}
                  >
                    📖 Quick Start Guide
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-sm"
                    onClick={() => router.push("/settings/account")}
                  >
                    ⚙️ Account Settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Secure Stripe Payment</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}