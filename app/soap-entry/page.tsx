'use client'

import SoapEntry2 from '@/components/SoapEntry2'
import { motion } from 'framer-motion'
import { Edit3, FileText, Sparkles } from 'lucide-react'

export default function SoapEntryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-300/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative container mx-auto py-8 max-w-6xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-3xl shadow-2xl ring-4 ring-emerald-200/50">
                <Edit3 className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-emerald-800 to-green-900 bg-clip-text text-transparent drop-shadow-sm">
                Manual SOAP Entry
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-bold shadow-lg">
                  <FileText className="h-3 w-3 mr-1 inline" />
                  Direct Input
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-bold shadow-lg">
                  <Sparkles className="h-3 w-3 mr-1 inline" />
                  AI Enhanced
                </div>
              </div>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            Create comprehensive clinical documentation with our 
            <span className="font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">intelligent form system</span>
          </motion.p>
        </motion.div>

        {/* SOAP Entry Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative"
        >
          <SoapEntry2 />
        </motion.div>
      </div>
    </div>
  )
}