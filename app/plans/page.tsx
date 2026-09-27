"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Crown,
  Zap,
  Shield,
  FileText,
  Star,
  Database,
  Headphones,
  Clock,
  Users,
  Award,
  Sparkles,
  CheckCircle,
  Lock,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: "AI-Powered Transcription",
    description: "Convert voice recordings to text with 99% accuracy using advanced AI models",
    color: "blue",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200/50 dark:border-blue-800/30",
  },
  {
    icon: FileText,
    title: "SOAP Note Generation",
    description: "Automatically generate structured clinical notes following SOAP format standards",
    color: "emerald",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200/50 dark:border-emerald-800/30",
  },
  {
    icon: Shield,
    title: "Secure PDF Export",
    description: "Export notes as encrypted, watermarked PDFs with digital signature support",
    color: "purple",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200/50 dark:border-purple-800/30",
  },
  {
    icon: Database,
    title: "EHR Integration",
    description: "Seamlessly connect with Epic, Cerner, and other major EHR systems via SMART on FHIR",
    color: "amber",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200/50 dark:border-amber-800/30",
  },
  {
    icon: Clock,
    title: "Real-Time Processing",
    description: "Process recordings and generate notes in seconds, not minutes",
    color: "rose",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200/50 dark:border-rose-800/30",
  },
  {
    icon: Users,
    title: "Multi-User Support",
    description: "Team collaboration features with role-based access and shared workflows",
    color: "indigo",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-200/50 dark:border-indigo-800/30",
  },
]

const benefits = [
  { text: "Save 3+ hours per day on documentation", color: "text-emerald-600 dark:text-emerald-400" },
  { text: "Reduce documentation errors by 85%", color: "text-blue-600 dark:text-blue-400" },
  { text: "HIPAA compliant with enterprise-grade security", color: "text-emerald-600 dark:text-emerald-400" },
  { text: "Works with any device - desktop, tablet, mobile", color: "text-blue-600 dark:text-blue-400" },
  { text: "24/7 priority support from clinical documentation experts", color: "text-emerald-600 dark:text-emerald-400" },
  { text: "Free training and onboarding for your entire team", color: "text-blue-600 dark:text-blue-400" },
]

const trustItems = [
  { icon: Headphones, title: "24/7 Support", desc: "Expert help when you need it most", iconBg: "bg-blue-100 dark:bg-blue-900/40", iconColor: "text-blue-600 dark:text-blue-400" },
  { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption and compliance", iconBg: "bg-emerald-100 dark:bg-emerald-900/40", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { icon: Zap, title: "Lightning Fast", desc: "Process notes in seconds, not minutes", iconBg: "bg-purple-100 dark:bg-purple-900/40", iconColor: "text-purple-600 dark:text-purple-400" },
  { icon: Star, title: "5-Star Rated", desc: "Loved by clinicians everywhere", iconBg: "bg-amber-100 dark:bg-amber-900/40", iconColor: "text-amber-600 dark:text-amber-400" },
]

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-300/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl" />

          <div className="relative px-6 py-10 sm:py-14 text-white text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative inline-block mb-4"
            >
              <div className="p-3.5 bg-white/20 backdrop-blur-sm rounded-2xl ring-1 ring-white/25 shadow-lg inline-flex">
                <Crown className="h-8 w-8 drop-shadow" />
              </div>
              <Sparkles className="h-4 w-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight mb-3">
              Unlock ClinicalScribe
              <span className="block sm:inline text-yellow-200"> Beta Access</span>
            </h1>

            <p className="text-blue-100/80 text-sm sm:text-base max-w-2xl mx-auto mb-5 font-medium leading-relaxed">
              Transform your clinical documentation with AI-powered transcription,
              automated SOAP note generation, and seamless EHR integration.
            </p>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm px-3 py-1">
                <Shield className="h-3 w-3 mr-1" /> HIPAA Compliant
              </Badge>
              <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm px-3 py-1">
                <Star className="h-3 w-3 mr-1" /> Trusted by 1000+ Clinicians
              </Badge>
              <Badge className="bg-white/20 text-white border-white/25 text-[10px] shadow-sm backdrop-blur-sm px-3 py-1">
                <Award className="h-3 w-3 mr-1" /> SOC 2 Certified
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Beta Access Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl" />

          {/* Card Header */}
          <div className="text-center px-6 pt-7 pb-4">
            <div className="mx-auto mb-3 w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
              Beta Access
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-[10px] px-2 py-0.5 font-bold">
                LIMITED TIME
              </Badge>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-lg mx-auto">
              Get full access to all ClinicalScribe features and help shape the future of clinical documentation
            </p>
          </div>

          {/* Features Grid */}
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={`flex items-start gap-3 p-3.5 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border ${feature.borderColor} transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                  >
                    <div className={`p-2 ${feature.iconBg} rounded-lg flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${feature.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{feature.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Why Choose ClinicalScribe */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Why Choose ClinicalScribe?</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                  <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${benefit.color}`} />
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-6 relative overflow-hidden text-center"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 rounded-t-2xl" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Start Your Journey Today</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Join thousands of healthcare professionals already saving hours daily
          </p>

          <Link href="/pricing">
            <Button
              size="lg"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 text-sm"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-4">
            <Lock className="h-3 w-3" />
            <span>Secure payment powered by Stripe &bull; Cancel anytime</span>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-2xl" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 text-center mb-5">
            Trusted by Healthcare Professionals Worldwide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trustItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="text-center p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className={`w-10 h-10 mx-auto mb-2 ${item.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5">{item.title}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-center pb-4"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Questions? Contact our team at{' '}
            <a href="mailto:support@clinicalscribe.com" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              support@clinicalscribe.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
