"use client";

import { useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles, Shield, Zap, Users, Clock, Heart, CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LandingPageContentInner() {
  const params = useSearchParams();
  const ref = params.get("ref");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      
      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-6xl mx-auto">
        {/* Beta Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border border-indigo-200/50 rounded-full px-6 py-3 mb-8 shadow-lg backdrop-blur-sm">
          <span className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-bold text-indigo-700">🚀 Now Available in Beta</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
          <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 bg-clip-text text-transparent">
            Welcome to
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            ClinicalScribe 🚀
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-2xl md:text-3xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
          <span className="font-black text-gray-900">Speak. Sign. Send.</span> 
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
            className="group px-10 py-5 bg-white/90 backdrop-blur-sm text-indigo-700 rounded-3xl shadow-xl hover:shadow-2xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 font-black text-xl"
          >
            <span className="flex items-center justify-center gap-3">
              💎 View Beta Plans
              <Sparkles className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-all duration-500" />
            </span>
          </Link>
          
          {/* YouTube Demo Button with Glassmorphism Effect */}
          <a
            href="https://youtube.com/@metalmindtech"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-10 py-5 bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-700/20 backdrop-blur-xl border border-red-300/30 rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 font-black text-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            <span className="relative flex items-center justify-center gap-3 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="group-hover:animate-pulse">
                  <path fill="#ffffff" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                <div className="absolute inset-0 bg-white/30 rounded-full blur-sm"></div>
              </div>
              Watch Demo
              <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-500" />
            </span>
          </a>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm">
            <Zap className="h-4 w-4 text-blue-600" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm">
            <Users className="h-4 w-4 text-purple-600" />
            <span>Limited Beta Access</span>
          </div>
        </div>
      </section>

      {/* Problem + Solution Section */}
      <section className="px-6 py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto text-center">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h2 className="text-4xl font-black text-red-600 mb-6">⏰ The Problem</h2>
              <p className="text-xl text-gray-700 leading-relaxed mb-8">
                Healthcare professionals lose <span className="font-black text-red-600">4+ hours every day</span> to paperwork. 
                Charting, SOAP notes, PDFs… it's endless.
              </p>
            </div>
            <div className="text-left">
              <h2 className="text-4xl font-black text-emerald-600 mb-6">💡 The Solution</h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                ClinicalScribe automates transcription & charting — so you can focus on 
                <span className="font-black text-emerald-600"> patients, not paperwork</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Powerful Features Built for Healthcare
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon="🎙️" 
              title="AI-Powered Transcription" 
              desc="Instantly convert speech into accurate transcripts in 50+ languages."
              gradient="from-blue-500 to-indigo-600"
            />
            <FeatureCard 
              icon="📑" 
              title="Automatic SOAP Notes" 
              desc="Generate structured SOAP charts in seconds, ready for EHR upload."
              gradient="from-purple-500 to-pink-600"
            />
            <FeatureCard 
              icon="🔒" 
              title="Secure PDF Export" 
              desc="Signed & watermarked documents with HIPAA-grade security."
              gradient="from-emerald-500 to-teal-600"
            />
            <FeatureCard 
              icon="⚡" 
              title="EHR Integration" 
              desc="One-click push to Epic & major EHRs (coming soon)."
              gradient="from-orange-500 to-red-600"
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            What Our Beta Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="ClinicalScribe cut my charting time by 70%. I finally leave work on time."
              author="Dr. J. Smith"
              role="Cardiologist"
              avatar="👨‍⚕️"
            />
            <TestimonialCard 
              quote="The transcription accuracy is incredible. My staff loves it."
              author="Nurse Patricia"
              role="Beta Tester"
              avatar="👩‍⚕️"
            />
            <TestimonialCard 
              quote="This feels like the future of healthcare documentation."
              author="Chief Medical Officer"
              role="Regional Hospital"
              avatar="🏥"
            />
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="px-6 py-20 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-16 text-gray-900">Why ClinicalScribe?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DifferentiatorCard 
              icon="🚀" 
              title="Real-time transcription in 50+ languages"
            />
            <DifferentiatorCard 
              icon="🛡️" 
              title="Built for HIPAA compliance & security"
            />
            <DifferentiatorCard 
              icon="⚡" 
              title="SOAP-ready notes with zero typing"
            />
            <DifferentiatorCard 
              icon="🔗" 
              title="Seamless EHR integration roadmap"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              title="Record"
              desc="Speak naturally during consultation"
              icon="🎤"
            />
            <StepCard 
              number="2"
              title="Auto-generate"
              desc="ClinicalScribe builds SOAP-ready notes"
              icon="🧠"
            />
            <StepCard 
              number="3"
              title="Review & Export"
              desc="Approve, sign, send to PDF or EHR"
              icon="✅"
            />
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="px-6 py-16 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-700 mb-8">Trusted Tech Stack</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700">HIPAA Compliant</div>
            <div className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700">Epic FHIR Sandbox</div>
            <div className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700">Stripe Secure Payments</div>
            <div className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700">Firebase by Google</div>
          </div>
          <p className="text-gray-600 mt-6 font-medium">
            ClinicalScribe is built on enterprise-grade, compliant infrastructure.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-slate-100 to-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16 text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FaqItem 
              question="Is ClinicalScribe HIPAA compliant?"
              answer="✅ Yes, HIPAA-ready and built with privacy-first design."
              isOpen={openFaq === 1}
              onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
            />
            <FaqItem 
              question="How long does the Beta last?"
              answer="✅ Limited Beta access will continue until general release in Q1 2026."
              isOpen={openFaq === 2}
              onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
            />
            <FaqItem 
              question="Can I cancel anytime?"
              answer="✅ Yes, you can cancel your subscription with one click."
              isOpen={openFaq === 3}
              onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
            />
            <FaqItem 
              question="Do I need special hardware?"
              answer="✅ No, works on any browser with a microphone."
              isOpen={openFaq === 4}
              onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
            Stop wasting hours on paperwork.
          </h2>
          <p className="text-2xl mb-12 text-gray-300 max-w-3xl mx-auto">
            Join the ClinicalScribe Beta today and reclaim your time.
          </p>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 font-black text-2xl"
          >
            <Heart className="h-7 w-7 group-hover:animate-pulse" />
            Join the Beta
            <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform duration-500" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient }: { icon: string; title: string; desc: string; gradient: string }) {
  return (
    <div className="group relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 rounded-3xl transition-all duration-500`}></div>
      <div className="relative p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 text-center group-hover:-translate-y-2">
        <span className="text-6xl block mb-6 group-hover:scale-110 transition-transform duration-500">{icon}</span>
        <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, role, avatar }: { quote: string; author: string; role: string; avatar: string }) {
  return (
    <div className="group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 via-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500"></div>
      <div className="relative p-8 bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 group-hover:-translate-y-2">
        <div className="flex gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-gray-700 text-lg mb-6 italic leading-relaxed">"{quote}"</p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            {avatar}
          </div>
          <div>
            <h4 className="font-black text-gray-900">{author}</h4>
            <p className="text-sm text-gray-600 font-medium">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DifferentiatorCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-4 p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 group">
      <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
      <span className="font-bold text-gray-900 text-lg">{title}</span>
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

function FaqItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onClick}
        className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
      >
        <span className="font-bold text-gray-900 text-lg">{question}</span>
        <ArrowRight className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <p className="text-gray-700 text-lg leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}