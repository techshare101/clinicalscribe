"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Shield, FileText, Star, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface PaywallCardProps {
  title?: string;
  description?: string;
  upgradeText?: string;
  priceId?: string;
  className?: string;
}

export default function PaywallCard({
  title = "Unlock ClinicalScribe Beta",
  description = "Subscribe to unlock beta access and start generating secure SOAP notes with AI-powered transcription.",
  upgradeText = "Upgrade Now",
  priceId = process.env.NEXT_PUBLIC_STRIPE_LINK_BETA || "price_1RvTL9GYIZIfzvtQNV1hCsX8",
  className = ""
}: PaywallCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    // Check if user is authenticated
    if (!auth.currentUser) {
      const errorMsg = "Please log in to upgrade your subscription.";
      setError(errorMsg);
      toast({
        title: "Authentication Required",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Check if user profile is loaded
    if (!profile) {
      const errorMsg = "Loading your profile... Please try again in a moment.";
      setError(errorMsg);
      toast({
        title: "Profile Loading",
        description: errorMsg,
        variant: "default",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Comprehensive authentication check
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }

      // Refresh user state and get fresh token
      console.log('Refreshing authentication state...');
      await auth.currentUser.reload();
      
      // Force refresh the ID token to ensure it's not expired
      const idToken = await auth.currentUser.getIdToken(true);
      
      // Validate token is not empty
      if (!idToken) {
        throw new Error("Failed to retrieve authentication token");
      }
      
      console.log('User authenticated:', auth.currentUser.uid);
      console.log('Token length:', idToken.length);
      console.log('Creating checkout session...');
      
      // Call our Stripe Checkout API
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Add as header too for debugging
        },
        body: JSON.stringify({
          priceId: priceId,
          idToken: idToken,
        }),
      });

      console.log('Checkout response status:', response.status);
      
      // Always parse JSON response
      const data = await response.json();
      console.log('Checkout response data:', data);

      if (!response.ok) {
        // Handle specific auth errors
        if (response.status === 401 || data.error?.includes('authentication') || data.error?.includes('token')) {
          // Try to sign out and back in for auth errors
          console.warn('Authentication error detected, user may need to re-login');
          toast({
            title: "Authentication Issue",
            description: "Please try logging out and back in, then try again.",
            variant: "destructive",
          });
        }
        
        // Handle different error scenarios
        const errorMessage = data.error || `HTTP ${response.status}: Failed to create checkout session`;
        console.error("Checkout failed:", data.error);
        setError(errorMessage);
        toast({
          title: "Checkout Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.url) {
        console.log('Redirecting to Stripe Checkout...');
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        const errorMsg = "No checkout URL returned from server";
        setError(errorMsg);
        toast({
          title: "Checkout Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      
      // Handle specific Firebase auth errors
      if (err.code === 'auth/id-token-expired' || err.code === 'auth/user-token-expired') {
        setError("Your session has expired. Please log out and log back in.");
        toast({
          title: "Session Expired",
          description: "Please log out and log back in, then try again.",
          variant: "destructive",
        });
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection and try again.");
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        const errorMessage = err.message || "Failed to start checkout. Please try again.";
        setError(errorMessage);
        toast({
          title: "Unexpected Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const features = [
    { icon: <Zap className="h-4 w-4" />, text: "AI-powered transcription" },
    { icon: <FileText className="h-4 w-4" />, text: "SOAP note generation" },
    { icon: <Shield className="h-4 w-4" />, text: "Secure PDF export" },
    { icon: <Star className="h-4 w-4" />, text: "EHR integration" },
  ];

  return (
    <Card className={`border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Crown className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          {title}
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Beta
          </Badge>
        </CardTitle>
        <CardDescription className="text-gray-600 max-w-md mx-auto">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
              <div className="text-blue-600">{feature.icon}</div>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button 
          onClick={handleUpgrade}
          disabled={loading || !auth.currentUser || !profile}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              {upgradeText}
            </>
          )}
        </Button>

        {!auth.currentUser && (
          <p className="text-sm text-orange-600 font-medium">
            Please log in to upgrade your subscription
          </p>
        )}
        
        {auth.currentUser && !profile && (
          <p className="text-sm text-blue-600 font-medium">
            Loading your profile...
          </p>
        )}

        <p className="text-xs text-gray-500 mt-3">
          🔒 Secure payment powered by Stripe • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}