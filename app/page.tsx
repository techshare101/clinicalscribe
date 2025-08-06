"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase"; // Firebase auth instance
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // Explicitly type as any

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        router.push("/dashboard"); // Redirect to dashboard if logged in
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold text-indigo-600">ClinicalScribe</h1>
        <div className="flex gap-4">
          <Link href="/auth/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
          The Future of Nursing Documentation
        </h1>
        <p className="text-xl text-gray-700 mb-10">
          AI-powered, privacy-first, and offline-ready. Built for nurses, by nurses.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">See Features</Button>
          </Link>
        </div>
      </section>

      {/* Video Placeholder */}
      <section className="px-6 py-10 text-center">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 md:h-96 mx-auto flex items-center justify-center">
          <span className="text-gray-500">🎥 Demo Video Placeholder</span>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features" className="px-6 py-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <FeatureCard title="Multilingual Transcription" icon="🌍" />
          <FeatureCard title="AI-Assisted Charting" icon="🧠" />
          <FeatureCard title="Visual + Audio Capture" icon="📸" />
          <FeatureCard title="Reusable Templates" icon="🔁" />
          <FeatureCard title="Intelligent Alerts" icon="🔔" />
          <FeatureCard title="PDF + EHR Integration" icon="🧾" />
          <FeatureCard title="Collaboration Mode" icon="👥" />
          <FeatureCard title="Analytics & Insights" icon="📊" />
          <FeatureCard title="Agent Add-ons" icon="🧬" />
          <FeatureCard title="Offline Mode" icon="🔐" />
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16 bg-indigo-50">
        <h2 className="text-3xl font-bold text-center mb-12">Trusted by Nurses</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <TestimonialCard name="Nurse Ava" role="ICU" quote="Saved me 2 hours daily!" />
          <TestimonialCard name="Dr. Ben" role="MD" quote="Best SOAP builder ever." />
          <TestimonialCard name="Kojo" role="Lead Engineer" quote="Built for real healthcare." />
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-600 border-t">
        <p>© 2025 ClinicalScribe by MetalMindTech. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
      <span className="text-3xl block mb-2">{icon}</span>
      <h3 className="text-md font-semibold">{title}</h3>
    </div>
  );
}

function TestimonialCard({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm">
      <p className="italic text-gray-700">"{quote}"</p>
      <p className="mt-4 font-semibold">{name}</p>
      <p className="text-sm text-gray-500">{role}</p>
    </div>
  );
}