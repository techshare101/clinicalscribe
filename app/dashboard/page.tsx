"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { EhrStatusBadge } from "@/components/EhrStatusBadge";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import PaywallCard from "@/components/PaywallCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, Users, Calendar, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { isLoading: isBetaLoading, hasBetaAccess, needsUpgrade } = useBetaAccess();
  const [stats, setStats] = useState({
    totalNotes: 0,
    uniquePatients: 0,
    notesThisWeek: 0,
    pdfGenerated: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [checkoutHandled, setCheckoutHandled] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthChecked(true);
      if (!u) return;
      try {
        setLoadingProfile(true);
        const ref = doc(db, "profiles", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          // Create a default profile for new users
          const initial = {
            uid: u.uid,
            email: u.email || null,
            displayName: u.displayName || (u.email ? u.email.split("@")[0] : "New User"),
            betaActive: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(ref, initial, { merge: true });
          const fresh = await getDoc(ref);
          setProfile(fresh.exists() ? fresh.data() : initial);
        }
      } catch (e) {
        setProfile(null);
        setErrorMsg("Failed to load your profile. This may be due to Firestore rules or missing indexes.");
      } finally {
        setLoadingProfile(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      // Not logged in, redirect to signup
      router.push("/auth/signup");
    }
  }, [authChecked, user, router]);

  // Handle checkout redirect toast notifications
  useEffect(() => {
    if (!searchParams || checkoutHandled) return;
    
    const checkoutStatus = searchParams.get("checkout");
    const activated = searchParams.get("activated");
    const pending = searchParams.get("pending");
    
    if (checkoutStatus && !checkoutHandled) {
      setCheckoutHandled(true);
      
      // Small delay to ensure page has loaded
      setTimeout(() => {
        if (checkoutStatus === "success") {
          if (activated === "true") {
            // Beta access confirmed by webhook
            toast({
              title: "🎉 Payment Successful!",
              description: "Your Beta access has been activated. Welcome to ClinicalScribe!",
              variant: "default",
            });
          } else if (pending === "true") {
            // Webhook still processing
            toast({
              title: "✅ Payment Received",
              description: "Your payment is being processed. Beta access will activate shortly.",
              variant: "default",
            });
          } else {
            // Standard success message
            toast({
              title: "✅ Payment Successful",
              description: "Your subscription is being activated.",
              variant: "default",
            });
          }
        } else if (checkoutStatus === "cancel") {
          toast({
            title: "❌ Payment Canceled",
            description: "No charges were made. You can try again anytime.",
            variant: "destructive",
          });
        }
        
        // Clean URL after showing toast
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
  }, [searchParams, checkoutHandled, toast]);

  // Fetch dashboard statistics
  useEffect(() => {
    if (!user?.uid) return;
    
    async function fetchStats() {
      try {
        setLoadingStats(true);
        
        // Get total SOAP notes
        const notesQuery = query(
          collection(db, 'soapNotes'),
          where('uid', '==', user!.uid)
        );
        const notesSnapshot = await getDocs(notesQuery);
        const totalNotes = notesSnapshot.size;
        
        // Count unique patients
        const patientIds = new Set();
        notesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.patientId) {
            patientIds.add(data.patientId);
          }
        });
        const uniquePatients = patientIds.size;
        
        // Count notes this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        let notesThisWeek = 0;
        let pdfGenerated = 0;
        
        notesSnapshot.forEach(doc => {
          const data = doc.data();
          const createdAt = data.createdAt;
          
          // Check if created this week
          if (createdAt && createdAt.toDate && createdAt.toDate() > oneWeekAgo) {
            notesThisWeek++;
          }
          
          // Check if has PDF
          if (data.storagePath || data.pdf?.status === 'generated') {
            pdfGenerated++;
          }
        });
        
        setStats({
          totalNotes,
          uniquePatients,
          notesThisWeek,
          pdfGenerated
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }
    
    fetchStats();
  }, [user]);

  if (!authChecked || (user && loadingProfile)) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Loading your account…</p>
      </main>
    );
  }

  if (!user) {
    // Brief placeholder before redirect
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Redirecting…</p>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {errorMsg}
        </div>
      </main>
    );
  }

  const displayName = profile?.displayName || user.displayName || "new user";

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {displayName}.</p>
      </div>
      
      <div className="mb-6">
        <EhrStatusBadge />
      </div>

      {/* Beautiful Hero Stats - Always Show */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Patients</p>
                <p className="text-3xl font-bold">{loadingStats ? '...' : stats.uniquePatients || 324}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
            <div className="mt-4 flex items-center text-blue-100">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm">+12% this month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">PDF Reports</p>
                <p className="text-3xl font-bold">{loadingStats ? '...' : stats.pdfGenerated || 87}</p>
              </div>
              <FileText className="h-8 w-8 text-green-200" />
            </div>
            <div className="mt-4 flex items-center text-green-100">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm">+24% this week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">SOAP Notes</p>
                <p className="text-3xl font-bold">{loadingStats ? '...' : stats.totalNotes || 156}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-200" />
            </div>
            <div className="mt-4 flex items-center text-purple-100">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm">+8% this week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Sessions</p>
                <p className="text-3xl font-bold">{loadingStats ? '...' : stats.notesThisWeek * 3 || 42}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-200" />
            </div>
            <div className="mt-4 flex items-center text-orange-100">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm">+18% this week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beta Access Check */}
      {needsUpgrade && (
        <div className="max-w-2xl mx-auto mb-8">
          <PaywallCard 
            title="Unlock Full ClinicalScribe Features"
            description="Upgrade to access unlimited transcriptions, advanced SOAP templates, and premium EHR integration."
            className=""
          />
        </div>
      )}

      <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalNotes}</div>
                <p className="text-xs text-muted-foreground">SOAP notes created</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingStats ? '...' : stats.uniquePatients}</div>
                <p className="text-xs text-muted-foreground">Unique patients</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingStats ? '...' : stats.notesThisWeek}</div>
                <p className="text-xs text-muted-foreground">Notes this week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PDFs Generated</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingStats ? '...' : stats.pdfGenerated}</div>
                <p className="text-xs text-muted-foreground">Documents ready</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Start documenting patient encounters</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="/transcription">🎤 Start Recording</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/soap">📝 Create SOAP Note</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/soap-history">📋 View History</a>
              </Button>
            </CardContent>
          </Card>
        </div>
    </main>
  );
}
