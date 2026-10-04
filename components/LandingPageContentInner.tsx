"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Shield, Zap, Users, Clock, Heart, CheckCircle, Star, Globe, FileText, Video, Brain, AlertTriangle, Lock, Activity, Rocket } from "lucide-react";
import Link from "next/link";
import FAQAccordion from "./FAQAccordion";

export default function LandingPageContentInner() {
  const [ref, setRef] = useState<string | null>(null);

  // Safely get search params on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRef(params.get("ref"));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/30">
      
      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-6xl mx-auto">
        {/* Beta Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40 border border-indigo-200/50 dark:border-indigo-700/50 rounded-full px-6 py-3 mb-8 shadow-lg backdrop-blur-sm">
          <span className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">🚀 Now Available in Beta</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
          <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
            Welcome to
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            ClinicalScribe 🚀
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
          <span className="font-black text-gray-900 dark:text-white">Speak. Sign. Send.</span> 
          {" "}The AI-powered medical scribe that saves you hours of charting — now in Beta.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
          <Link
            href="/auth/signup"
            className="group relative px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 font-black text-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative flex items-center justify-center gap-3">
              <Heart className="h-6 w-6 group-hover:animate-pulse" />
              Join the Beta
              <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-500" />
            </span>
          </Link>
          
          <Link
            href="/pricing"
            className="group px-10 py-5 bg-white/90 dark:bg-white/10 backdrop-blur-sm text-indigo-700 dark:text-indigo-300 rounded-3xl shadow-xl hover:shadow-2xl border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-white/15 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 font-black text-xl"
          >
            <span className="flex items-center justify-center gap-3">
              💎 View Beta Plans
              <Sparkles className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-all duration-500" />
            </span>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-full shadow-sm">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>256-bit Encrypted</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-full shadow-sm">
            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-full shadow-sm">
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Limited Beta Access</span>
          </div>
        </div>
      </section>

      {/* Problem + Solution Section */}
      <section className="px-6 py-20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto text-center">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h2 className="text-4xl font-black text-red-600 dark:text-red-400 mb-6">⏰ The Problem</h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
                Healthcare professionals lose <span className="font-black text-red-600 dark:text-red-400">4+ hours every day</span> to paperwork. 
                Charting, SOAP notes, PDFs… it’s endless.
              </p>
            </div>
            <div className="text-left">
              <h2 className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-6">💡 The Solution</h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                ClinicalScribe automates transcription & charting — so you can focus on 
                <span className="font-black text-emerald-600 dark:text-emerald-400"> patients, not paperwork</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10-Pillar Features Grid */}
      <section className="px-6 py-20 bg-gradient-to-b from-transparent to-white/50 dark:to-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            10 Pillars of Innovation
          </h2>
          <p className="text-center text-xl text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
            Every feature designed with healthcare professionals in mind
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <FeatureCardV2 
              icon={Globe}
              title="Multilingual Transcription" 
              desc="Real-time speech-to-text in 50+ languages with Whisper + Gemini."
              gradient="from-blue-500 to-indigo-600"
            />
            <FeatureCardV2 
              icon={FileText}
              title="Smart Charting" 
              desc="AI-assisted SOAP notes, ICD-10 code suggestions, and care plan drafts."
              gradient="from-purple-500 to-pink-600"
            />
            <FeatureCardV2 
              icon={Video}
              title="Visual + Audio Capture" 
              desc="Attach timestamped images or videos securely to clinical notes."
              gradient="from-emerald-500 to-teal-600"
            />
            <FeatureCardV2 
              icon={Brain}
              title="Reusable Templates" 
              desc="Custom flows for intake, vitals, discharge, and specialty protocols."
              gradient="from-orange-500 to-red-600"
            />
            <FeatureCardV2 
              icon={AlertTriangle}
              title="Red Flag Alerts" 
              desc="Detect urgent symptoms or tone-of-voice cues during transcription."
              gradient="from-red-600 to-pink-600"
            />
            <FeatureCardV2 
              icon={Shield}
              title="EHR-Ready Export" 
              desc="Export-ready notes your staff files in minutes, plus signed PDFs."
              gradient="from-cyan-500 to-blue-600"
            />
            <FeatureCardV2 
              icon={Users}
              title="Shift Handoff" 
              desc="Generate quick briefs + checklist summaries for the next nurse."
              gradient="from-indigo-500 to-purple-600"
            />
            <FeatureCardV2 
              icon={Activity}
              title="Analytics + Burnout Protection" 
              desc="Track workload, charting time, and nudge breaks."
              gradient="from-green-500 to-emerald-600"
            />
            <FeatureCardV2 
              icon={Rocket}
              title="Agent Add-ons" 
              desc="Cultural Navigator, Language Tutor, and Patient Companion modes."
              gradient="from-violet-500 to-purple-600"
            />
            <FeatureCardV2 
              icon={Lock}
              title="Privacy-First" 
              desc="256-bit encrypted in transit and at rest with secure cloud storage."
              gradient="from-gray-600 to-gray-800"
            />
          </div>
        </div>
      </section>

      {/* Workflow Highlights */}
      <section className="px-6 py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Built for Clinical Workflows
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Say goodbye to pajama-time charting. Streamline your documentation with tools crafted for busy clinicians.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Eliminate Evening Charting</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Speak your findings directly between patient visits. Get structured SOAP notes instantly so your workday ends when clinic ends.
              </p>
            </div>
            <div className="p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Structured SOAP Formatting</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Automatically organizes patient encounters into clean Subjective, Objective, Assessment, and Plan drafts formatted for effortless review.
              </p>
            </div>
            <div className="p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Security &amp; Privacy First</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                256-bit encryption in transit and at rest, role-based access control, and complete data isolation safeguard your practice documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQAccordion 
        items={[
          {
            question: "How is patient data protected?",
            answer: "We use 256-bit encryption for data in transit and at rest, secure cloud storage with strict access controls, and comprehensive audit logging. Your clinical records remain private to your practice."
          },
          {
            question: "How much time will this save me?",
            answer: "ClinicalScribe is designed to eliminate after-hours documentation. Instead of typing notes after a long clinic day, you speak naturally and let our AI handle the structuring, turning verbal notes into structured drafts in seconds."
          },
          {
            question: "Does it work with my EHR?",
            answer: "Yes — we provide export-ready notes your staff files in minutes. Our structured text and PDF notes are formatted to clinical documentation standards for effortless filing into any EHR system."
          },
          {
            question: "What languages are supported?",
            answer: "Our AI supports 50+ languages for transcription, including Spanish, Mandarin, French, Arabic, and more. The system automatically detects the language being spoken and can even handle multi-language conversations."
          },
          {
            question: "Can I use this offline?",
            answer: "Yes! ClinicalScribe offers offline functionality for core features. Your notes are securely synced when you reconnect to the internet. This ensures you can document patient care even in areas with poor connectivity."
          },
          {
            question: "How accurate is the transcription?",
            answer: "Our system uses advanced speech recognition and medical vocabulary normalization tuned for clinical terms, medication names, and complex diagnoses. You maintain full oversight with quick review and editing before finalizing."
          }
        ]}
      />

      {/* Demo Video Section */}
      <section id="demo" className="px-6 py-20 bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-8">See ClinicalScribe in Action</h2>
          <div className="aspect-video bg-black/30 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-xl text-white/80">Demo Video Coming Soon</p>
              <p className="text-sm text-white/60 mt-2">Subscribe to get notified when it's ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Document with Confidence? CTA Banner */}
      <section className="px-6 py-20 bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-950 text-white relative overflow-hidden border-t border-indigo-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.3),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
            Ready to Document with Confidence?
          </h2>
          <p className="text-lg sm:text-xl text-indigo-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Let ClinicalScribe automate your ambient documentation, SOAP generation, and clinical filing so you can focus 100% on patient care.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl shadow-xl hover:shadow-2xl font-bold text-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <span>Try ClinicalScribe</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 font-semibold text-lg transition-all"
            >
              View Plans &amp; Pricing
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient }: { icon: string; title: string; desc: string; gradient: string }) {
  return (
    <div className="group relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 rounded-3xl transition-all duration-500`}></div>
      <div className="relative p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-500 text-center group-hover:-translate-y-2">
        <span className="text-6xl block mb-6 group-hover:scale-110 transition-transform duration-500">{icon}</span>
        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FeatureCardV2({ icon: Icon, title, desc, gradient }: { icon: any; title: string; desc: string; gradient: string }) {
  return (
    <div className="group relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-all duration-500`}></div>
      <div className="relative p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-500 group-hover:-translate-y-1">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}


function DifferentiatorCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 group">
      <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
      <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">{title}</span>
    </div>
  );
}

function StepCard({ number, title, desc, icon }: { number: string; title: string; desc: string; icon: string }) {
  return (
    <div className="relative">
      <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center hover:bg-white/30 transition-all duration-500 border border-white/30 hover:border-white/50 group">
        <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">{icon}</div>
        <div className="text-6xl font-black text-white/20 mb-4">{number}</div>
        <h3 className="text-2xl font-black mb-4">{title}</h3>
        <p className="text-white/90 text-lg leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

