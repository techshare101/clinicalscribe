import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, Zap, Users, BarChart3, Clock, Heart } from "lucide-react";

export default function StaticLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-white/20 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">CS</span>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              ClinicalScribe
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/login">
              <Button variant="outline" className="rounded-xl border-2 font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Free Beta
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 border border-blue-200/50 rounded-full px-6 py-2 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-gray-700">✨ AI-Powered Clinical Documentation</span>
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
          <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            Transform Your
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
            Clinical Workflow
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          <span className="font-semibold text-gray-800">Speak. Sign. Send.</span> 
          {" "}The AI-powered medical scribe that works as hard as you do. 
          <span className="font-medium text-blue-700"> Privacy-first</span> and 
          <span className="font-medium text-purple-700"> offline-ready</span>.
        </p>

        {/* Main CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Link href="/auth/signup">
            <Button 
              size="lg" 
              className="group bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 px-8 py-6 text-lg font-bold"
            >
              <Heart className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              Start Free Beta Access
              <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-2xl border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 px-8 py-6 text-lg font-semibold"
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Works Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="font-medium">Trusted by 1000+ Nurses</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span className="font-medium">Save 2+ Hours Daily</span>
          </div>
        </div>
      </section>

      {/* Video Demo Placeholder */}
      <section id="demo" className="px-6 py-16 text-center max-w-6xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="relative bg-white/80 backdrop-blur-xl border-2 border-white/50 rounded-3xl w-full h-64 md:h-96 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-shadow duration-500 overflow-hidden">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                <span className="text-3xl text-white">🎥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">See ClinicalScribe in Action</h3>
              <p className="text-gray-600 max-w-md mx-auto">Watch how nurses save hours daily with AI-powered documentation</p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <span className="mr-2">▶️</span>
                Play Demo (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features" className="px-6 py-20 bg-white/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Powerful Features Built for Healthcare
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to revolutionize clinical documentation, from voice transcription to intelligent SOAP notes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <FeatureCard title="Multilingual Transcription" icon="🌍" gradient="from-emerald-400 to-teal-600" />
            <FeatureCard title="AI-Assisted Charting" icon="🧠" gradient="from-blue-400 to-indigo-600" />
            <FeatureCard title="Visual + Audio Capture" icon="📸" gradient="from-purple-400 to-pink-600" />
            <FeatureCard title="Smart Templates" icon="🔁" gradient="from-orange-400 to-red-600" />
            <FeatureCard title="Intelligent Alerts" icon="🔔" gradient="from-yellow-400 to-orange-600" />
            <FeatureCard title="PDF + EHR Export" icon="🧾" gradient="from-cyan-400 to-blue-600" />
            <FeatureCard title="Team Collaboration" icon="👥" gradient="from-pink-400 to-purple-600" />
            <FeatureCard title="Analytics Dashboard" icon="📊" gradient="from-indigo-400 to-blue-600" />
            <FeatureCard title="AI Agents" icon="🧬" gradient="from-violet-400 to-purple-600" />
            <FeatureCard title="Offline Mode" icon="🔐" gradient="from-slate-400 to-gray-600" />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Trusted by Healthcare Professionals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Sarah Martinez, RN" 
              role="ICU • Houston Methodist" 
              quote="ClinicalScribe cut my documentation time in half. The AI understands medical terminology perfectly!" 
              avatar="👩‍⚕️"
            />
            <TestimonialCard 
              name="Dr. Michael Chen" 
              role="Emergency Medicine • UCSF" 
              quote="Best SOAP note generator I've ever used. Accurate, fast, and actually helpful." 
              avatar="👨‍⚕️"
            />
            <TestimonialCard 
              name="Jennifer Adams, BSN" 
              role="Pediatric ICU • Children's Hospital" 
              quote="Privacy-first design gives me confidence. Finally, an AI tool built for real healthcare." 
              avatar="👩‍⚕️"
            />
          </div>

          {/* Beta CTA */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 rounded-3xl shadow-2xl">
              <h3 className="text-3xl font-black text-white mb-4">Join the Beta Program</h3>
              <p className="text-blue-100 text-lg mb-6 max-w-md mx-auto">
                Get early access to ClinicalScribe and help shape the future of clinical documentation.
              </p>
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-700 hover:bg-blue-50 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-bold"
                >
                  <Sparkles className="h-5 w-5 mr-3" />
                  Get Beta Access Now
                  <ArrowRight className="h-5 w-5 ml-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CS</span>
                </div>
                <span className="text-xl font-black text-white">ClinicalScribe</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered clinical documentation that saves time and improves patient care.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-blue-400 transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-blue-400 transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© 2025 ClinicalScribe by MetalMindTech. All rights reserved. Built with ❤️ for healthcare professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, icon, gradient }: { title: string; icon: string; gradient: string }) {
  return (
    <div className="group relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300`}></div>
      <div className="relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl border border-white/50 transition-all duration-300 text-center group-hover:-translate-y-1">
        <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</span>
        <h3 className="text-sm font-bold text-gray-800 group-hover:text-gray-900">{title}</h3>
      </div>
    </div>
  );
}

function TestimonialCard({ name, role, quote, avatar }: { name: string; role: string; quote: string; avatar: string }) {
  return (
    <div className="group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500"></div>
      <div className="relative p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 group-hover:-translate-y-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            {avatar}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{name}</h4>
            <p className="text-sm text-gray-600">{role}</p>
          </div>
        </div>
        <p className="italic text-gray-700 leading-relaxed">"{quote}"</p>
        <div className="flex gap-1 mt-4">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-yellow-400 text-lg">⭐</span>
          ))}
        </div>
      </div>
    </div>
  );
}