"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPageContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/dashboard");
  
  // Get redirect path from URL query parameters
  useEffect(() => {
    // Only run on client side after component mounts
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pathParam = params.get("redirectPath");
      if (pathParam) {
        setRedirectPath(pathParam);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      console.log('🔑 Login: Starting authentication...');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      console.log('✅ Login: Firebase authentication successful for user:', user.uid);
      
      console.log('🎫 Login: Getting ID token...');
      const idToken = await user.getIdToken();
      console.log('✅ Login: ID token obtained, length:', idToken.length);
      
      console.log('🍪 Login: Setting session...');
      await setSession(idToken);
      console.log(`✅ Login: Session set successfully, redirecting to ${redirectPath}`);
      
      router.push(redirectPath);
    } catch (err: any) {
      console.error('❌ Login: Error occurred:', err);
      
      // Provide more specific error messages
      let errorMessage = "Login failed";
      if (err.message?.includes('session')) {
        errorMessage = `Login successful, but session creation failed: ${err.message}`;
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your email and password.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-sm text-red-600" role="alert">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="text-sm text-gray-600 mt-4">
          Don't have an account? <a href="/auth/signup" className="text-blue-600 underline">Sign up</a>
        </div>
      </div>
    </div>
  );
}