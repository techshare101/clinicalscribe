"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Menu, ClipboardList, Mic, FileText, ShieldCheck, Edit, History, Link as LinkIcon } from "lucide-react";
import { EhrStatusBadge } from "@/components/EhrStatusBadge";
import { PaywallCard } from "@/components/PaywallCard";
import { toast } from "@/lib/toast";

export default function ClinicalDashboard() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null); // Explicitly type as any
  const router = useRouter();
  const search = useSearchParams();
  const [betaActive, setBetaActive] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load profile.betaActive from Firestore
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
          const data = profileSnap.data();
          setBetaActive(!!data?.betaActive);
        } catch {
          setBetaActive(false);
        }
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (search?.get("upgraded") === "true") {
      // Optionally show a toast here if you have one wired globally
      // toast({ title: "Beta unlocked successfully! 🎉" });
    }
  }, [search]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const toggleSidebar = () => setOpen(!open);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (betaActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md w-full">
          <PaywallCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-white shadow-md w-64 p-4 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <h2 className="text-2xl font-bold text-indigo-600 mb-6">ClinicalScribe</h2>
        <nav className="flex flex-col gap-4">
          <a href="/" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><ShieldCheck size={20} /> Dashboard</a>
          <a href="/soap" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><ClipboardList size={20} /> SOAP Notes</a>
          <a href="/soap-entry" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><Edit size={20} /> SOAP Entry</a>
          <a href="/soap-history" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><History size={20} /> SOAP History</a>
          <a href="/transcription" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><Mic size={20} /> Transcription</a>
          <a href="/test-soap" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><FileText size={20} /> Test SOAP</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="md:hidden" onClick={toggleSidebar}><Menu /></Button>
          <div className="flex items-center gap-4">
            <EhrStatusBadge />
            <a
              href="/smart/launch/default"
              className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:text-indigo-900"
              title="Connect to EHR via SMART on FHIR"
            >
              <LinkIcon size={16} /> Connect to EHR
            </a>
            <Bell className="text-gray-600" />
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Notes</h3>
              <p className="text-3xl font-bold">237</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Transcriptions</h3>
              <p className="text-3xl font-bold">178</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">SOAPs</h3>
              <p className="text-3xl font-bold">63</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h4 className="text-xl font-semibold mb-4">Recent Activity</h4>
          <ul className="space-y-3">
            <li className="text-gray-700">📝 SOAP note created for patient #12345</li>
            <li className="text-gray-700">🎙️ Transcription uploaded by Nurse Ava</li>
            <li className="text-gray-700">✅ System check completed</li>
            <li className="text-gray-700">🔔 Alert: Patient reports dizziness</li>
            <li className="text-gray-700">📸 Image captured during wound assessment</li>
          </ul>
        </div>
      </main>
    </div>
  );
}