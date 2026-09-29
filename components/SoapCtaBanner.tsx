'use client'

import Link from 'next/link'
import { ArrowRight, Mic, Sparkles } from 'lucide-react'

export default function SoapCtaBanner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-xl p-6 sm:p-8 my-8 border border-emerald-400/30 ${className}`}
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-400/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Voice-to-SOAP AI Automation</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Generate notes like this from your voice
          </h3>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
            Ambient clinical transcription with automated SOAP synthesis, red-flag detection, and EHR export in seconds.
          </p>
        </div>

        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 whitespace-nowrap px-6 py-3.5 rounded-xl bg-white text-emerald-800 font-bold text-sm sm:text-base hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span>Try ClinicalScribe free</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
