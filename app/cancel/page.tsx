"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCw, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CancelPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [mounted, setMounted] = useState(false);
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !autoRedirectEnabled) return;
    
    let countdownTimer: NodeJS.Timeout;
    
    // Start countdown and redirect
    let count = 5;
    countdownTimer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownTimer);
        router.push("/dashboard?checkout=cancel");
      }
    }, 1000);

    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [router, mounted, autoRedirectEnabled]);

  const handleGoToDashboard = () => {
    router.push("/dashboard?checkout=cancel");
  };

  const handleTryAgain = () => {
    router.push("/pricing");
  };

  const handleDisableAutoRedirect = () => {
    setAutoRedirectEnabled(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-500 shadow-lg">
              <XCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            ❌ Payment Canceled
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            No charges were made to your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="text-center space-y-4">
            <p className="text-gray-700 text-lg">
              You can try again anytime to unlock ClinicalScribe Beta access.
            </p>
            <p className="text-sm text-gray-500">
              Your session was securely canceled and no payment was processed.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3 text-center">💡 Why Choose ClinicalScribe?</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center space-x-2">
                <span>✨</span>
                <span>AI-powered SOAP note generation saves 2+ hours daily</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🔒</span>
                <span>HIPAA-compliant with enterprise-grade security</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🏥</span>
                <span>Seamless EHR integration with major providers</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🎯</span>
                <span>Built specifically for nursing workflows</span>
              </div>
            </div>
          </div>

          {/* Auto-redirect Notice */}
          {autoRedirectEnabled && countdown > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Taking you back to dashboard in <span className="font-bold text-red-600 text-lg">{countdown}s</span>
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
              onClick={handleTryAgain}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
              size="lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again - View Pricing
            </Button>
            
            <Button 
              onClick={handleGoToDashboard}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Return to Dashboard
            </Button>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Secure Stripe Payment</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center space-x-1">
                <span>💬</span>
                <span>Need Help? Contact Support</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}