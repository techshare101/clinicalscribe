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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export type Discipline = 'general' | 'chiropractic' | 'massage' | 'yoga' | 'pt' | 'clinical'

const DISCIPLINES: { key: Discipline; label: string; icon: any; color: string }[] = [
  { key: 'general', label: 'All Disciplines', icon: Edit3, color: 'bg-white/20' },
  { key: 'chiropractic', label: 'Chiropractic', icon: Bone, color: 'bg-orange-500/30' },
  { key: 'massage', label: 'Massage Therapy', icon: Heart, color: 'bg-pink-500/30' },
  { key: 'yoga', label: 'Yoga & Pilates', icon: Leaf, color: 'bg-emerald-500/30' },
  { key: 'pt', label: 'Physical Therapy', icon: Activity, color: 'bg-blue-500/30' },
  { key: 'clinical', label: 'Hospital / Clinical', icon: Stethoscope, color: 'bg-indigo-500/30' },
]

export default function SoapEntryPage() {
  const [discipline, setDiscipline] = useState<Discipline>('general')
  const [showPicker, setShowPicker] = useState(false)

  const active = DISCIPLINES.find((d) => d.key === discipline) || DISCIPLINES[0]

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <active.icon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold leading-tight">
                    AI-Powered Session Documentation
                  </h1>
                  <p className="text-white/70 text-xs sm:text-sm">
                    Structured SOAP notes for wellness &amp; clinical professionals
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 text-[10px] hidden sm:flex">
                <Sparkles className="h-3 w-3 mr-1" /> AI Enhanced
              </Badge>
            </div>

            {/* Discipline Selector */}
            <div className="mt-3 relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium transition-colors border border-white/20"
              >
                <active.icon className="h-3.5 w-3.5" />
                <span>{active.label}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
              </button>

              {showPicker && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowPicker(false)} />
                  <div className="absolute top-full left-0 mt-1.5 z-30 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[220px]">
                    {DISCIPLINES.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => { setDiscipline(d.key); setShowPicker(false) }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          discipline === d.key
                            ? 'bg-emerald-50 text-emerald-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <d.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{d.label}</span>
                        {discipline === d.key && (
                          <span className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

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
