"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
import { setSession } from "@/lib/session";
import { Building2 } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get("invite") ?? null;

  // If there's an invite token, show a banner
  const [inviteInfo, setInviteInfo] = useState<{ orgName: string; email: string } | null>(null);

  useEffect(() => {
    if (!inviteToken) return;
    // Validate invite token to show org name
    fetch(`/api/admin/invites/validate?token=${inviteToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setInviteInfo({ orgName: data.orgName, email: data.email });
          setEmail(data.email); // Pre-fill email from invite
        }
      })
      .catch(() => {});
  }, [inviteToken]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
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
      console.log('✅ Signup: Session set successfully');

      // If there's an invite token, accept it to join the organization
      if (inviteToken) {
        try {
          console.log('🏢 Signup: Accepting organization invite...');
          const acceptRes = await fetch("/api/admin/invites/accept", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ inviteToken }),
          });
          const acceptData = await acceptRes.json();
          if (acceptData.ok) {
            console.log('✅ Signup: Invite accepted, joined', acceptData.orgName);
          } else {
            console.warn('⚠️ Signup: Invite acceptance failed:', acceptData.error);
          }
        } catch (inviteErr) {
          console.warn('⚠️ Signup: Invite acceptance error:', inviteErr);
        }
      }
      
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">Create Account</h1>
        
        {inviteInfo && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-indigo-900">Organization Invite</span>
            </div>
            <p className="text-sm text-indigo-700">
              You've been invited to join <strong>{inviteInfo.orgName}</strong>. 
              Sign up with <strong>{inviteInfo.email}</strong> to get started.
            </p>
          </div>
        )}

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
              readOnly={!!inviteInfo}
              className={inviteInfo ? "bg-gray-50" : ""}
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
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Creating account..." : inviteInfo ? `Join ${inviteInfo.orgName}` : "Sign Up"}
          </Button>
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
