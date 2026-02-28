'use client'

import SoapEntry2 from '@/components/SoapEntry2'
import { motion } from 'framer-motion'
import { Edit3, Sparkles, Activity, Heart, Bone, Leaf } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function SoapEntryPage() {
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
          <div className="relative z-10 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Edit3 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Session Documentation</h1>
                  <p className="text-white/70 text-sm">SOAP notes for every wellness discipline</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30 text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" /> AI Enhanced
                </Badge>
              </div>
            </div>
            {/* Vertical chips */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {[
                { icon: Bone, label: 'Chiropractic' },
                { icon: Leaf, label: 'Yoga & Pilates' },
                { icon: Heart, label: 'Massage Therapy' },
                { icon: Activity, label: 'Physical Therapy' },
              ].map((v) => (
                <span
                  key={v.label}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white/80 font-medium"
                >
                  <v.icon className="h-3 w-3" /> {v.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* SOAP Entry Component */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SoapEntry2 />
        </motion.div>
      </div>
    </div>
  )
}
