"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
import { setSession } from "@/lib/session";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🔐 Signup: Creating user account...');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      console.log('✅ Signup: User account created:', user.uid);
      
      console.log('📄 Signup: Creating user profile...');
      // Initialize profile document with betaActive false
      await setDoc(doc(db, 'profiles', user.uid), { betaActive: false, createdAt: Date.now() }, { merge: true });
      console.log('✅ Signup: User profile created');
      
      console.log('🎫 Signup: Getting ID token...');
      // Set session cookie for server routes
      const idToken = await user.getIdToken();
      console.log('✅ Signup: ID token obtained, length:', idToken.length);
      
      console.log('🍪 Signup: Setting session...');
      await setSession(idToken);
      console.log('✅ Signup: Session set successfully, redirecting to dashboard');
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error('❌ Signup: Error occurred:', err);
      
      // Provide more specific error messages
      let errorMessage = "Failed to create account.";
      if (err.message?.includes('session')) {
        errorMessage = `Account created successfully, but session creation failed: ${err.message}`;
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">Create Account</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit">Sign Up</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/" className="text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
