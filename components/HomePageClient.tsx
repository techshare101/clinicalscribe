"use client";

import { useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

export default function HomePageClient() {
  const params = useSearchParams();
  const ref = params.get("ref");

  return (
    <div className="text-center max-w-4xl px-6">
      {/* Beta Badge */}
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border border-indigo-200/50 rounded-full px-6 py-2 mb-8">
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
        <span className="text-sm font-semibold text-indigo-700">✨ Now Available in Beta</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
        <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 bg-clip-text text-transparent">
          Welcome to
        </span>
        <br />
        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          ClinicalScribe 🚀
        </span>
      </h1>

      {/* Dynamic Message */}
      <div className="mb-12">
        {ref ? (
          <div className="space-y-4">
            <p className="text-2xl text-gray-700">
              Thanks for visiting via <span className="font-bold text-indigo-600">{ref}</span> 🎉
            </p>
            <p className="text-lg text-gray-600">
              You're invited to join our exclusive Beta program!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-2xl md:text-3xl text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">Speak. Sign. Send.</span> 
              {" "}The AI-powered medical scribe now in 
              <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Beta</span>.
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join healthcare professionals revolutionizing clinical documentation with AI
            </p>
          </div>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
        <a
          href="/auth/signup"
          className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 font-bold text-lg overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center justify-center gap-3">
            <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
            Join the Beta
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </span>
        </a>
        
        <a
          href="/pricing"
          className="group px-8 py-4 bg-white/90 backdrop-blur-sm text-indigo-700 rounded-2xl shadow-lg hover:shadow-xl border-2 border-indigo-200 hover:border-indigo-300 hover:bg-white transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 font-bold text-lg"
        >
          <span className="flex items-center justify-center gap-3">
            💎 View Beta Plans
            <Sparkles className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </span>
        </a>
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="font-medium">HIPAA Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="font-medium">AI-Powered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Limited Beta Access</span>
        </div>
      </div>
    </div>
  );
}