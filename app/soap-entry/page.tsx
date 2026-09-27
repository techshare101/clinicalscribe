'use client'

import { useState } from 'react'
import SoapEntry2 from '@/components/SoapEntry2'
import { motion } from 'framer-motion'
import {
  Edit3,
  Sparkles,
  Activity,
  Heart,
  Bone,
  Leaf,
  Stethoscope,
  ChevronDown,
  Zap,
} from 'lucide-react'

export type Discipline = 'general' | 'chiropractic' | 'massage' | 'yoga' | 'pt' | 'clinical'

const DISCIPLINES: {
  key: Discipline
  label: string
  icon: any
  chipBg: string
  chipText: string
  chipBorder: string
  dropBg: string
  dropText: string
}[] = [
  { key: 'general', label: 'All Disciplines', icon: Edit3, chipBg: 'bg-white/20', chipText: 'text-white', chipBorder: 'border-white/30', dropBg: 'bg-gray-50', dropText: 'text-gray-800' },
  { key: 'chiropractic', label: 'Chiropractic', icon: Bone, chipBg: 'bg-orange-400/25', chipText: 'text-orange-100', chipBorder: 'border-orange-300/40', dropBg: 'bg-orange-50', dropText: 'text-orange-800' },
  { key: 'massage', label: 'Massage Therapy', icon: Heart, chipBg: 'bg-pink-400/25', chipText: 'text-pink-100', chipBorder: 'border-pink-300/40', dropBg: 'bg-pink-50', dropText: 'text-pink-800' },
  { key: 'yoga', label: 'Yoga & Pilates', icon: Leaf, chipBg: 'bg-lime-400/25', chipText: 'text-lime-100', chipBorder: 'border-lime-300/40', dropBg: 'bg-lime-50', dropText: 'text-lime-800' },
  { key: 'pt', label: 'Physical Therapy', icon: Activity, chipBg: 'bg-sky-400/25', chipText: 'text-sky-100', chipBorder: 'border-sky-300/40', dropBg: 'bg-sky-50', dropText: 'text-sky-800' },
  { key: 'clinical', label: 'Hospital / Clinical', icon: Stethoscope, chipBg: 'bg-violet-400/25', chipText: 'text-violet-100', chipBorder: 'border-violet-300/40', dropBg: 'bg-violet-50', dropText: 'text-violet-800' },
]

export default function SoapEntryPage() {
  const [discipline, setDiscipline] = useState<Discipline>('general')
  const [showPicker, setShowPicker] = useState(false)

  const active = DISCIPLINES.find((d) => d.key === discipline) || DISCIPLINES[0]

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-5">
        {/* Header — z-50 so dropdown floats above everything */}
        <div className="relative z-50">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl shadow-lg"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl" />
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.02] rounded-full" />

            <div className="relative px-6 py-5 text-white">
              {/* Top row: Title + AI badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl shadow-inner">
                    <active.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight">
                      AI-Powered Session Documentation
                    </h1>
                    <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                      Structured SOAP notes for wellness &amp; clinical professionals
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400/30 to-yellow-400/30 border border-amber-300/40 rounded-full">
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  <span className="text-xs font-semibold text-amber-100 tracking-wide">AI Enhanced</span>
                  <Zap className="h-3 w-3 text-yellow-300" />
                </div>
              </div>

              {/* Discipline chips — always visible, colorful */}
              <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                {DISCIPLINES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDiscipline(d.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                      discipline === d.key
                        ? 'bg-white text-emerald-800 border-white shadow-md scale-105'
                        : `${d.chipBg} ${d.chipText} ${d.chipBorder} hover:bg-white/20`
                    }`}
                  >
                    <d.icon className="h-3 w-3" />
                    <span className="hidden xs:inline">{d.label}</span>
                    <span className="xs:hidden">{d.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Active discipline indicator with dropdown for details */}
              <div className="mt-3 relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    discipline === 'general'
                      ? 'bg-white/15 border-white/25 hover:bg-white/25'
                      : `${active.chipBg} ${active.chipBorder} hover:bg-white/25`
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active: {active.label}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
                </button>

                {showPicker && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowPicker(false)} />
                    <div className="absolute top-full left-0 mt-2 z-[70] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 min-w-[260px]">
                      <div className="px-3 py-1.5 mb-1 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Discipline</p>
                      </div>
                      {DISCIPLINES.map((d) => (
                        <button
                          key={d.key}
                          onClick={() => { setDiscipline(d.key); setShowPicker(false) }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all ${
                            discipline === d.key
                              ? `${d.dropBg} ${d.dropText} font-semibold`
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            discipline === d.key ? d.dropBg : 'bg-gray-100'
                          }`}>
                            <d.icon className={`h-4 w-4 ${discipline === d.key ? d.dropText : 'text-gray-500'}`} />
                          </span>
                          <span>{d.label}</span>
                          {discipline === d.key && (
                            <span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* SOAP Entry Component */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SoapEntry2 discipline={discipline} />
        </motion.div>
      </div>
    </div>
  )
}
