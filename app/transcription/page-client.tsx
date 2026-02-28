'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import Recorder from "@/components/Recorder"
import { SOAPGenerator } from "@/components/SOAPGenerator"
import { createPatientSession } from "@/lib/createPatientSession"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Globe,
  Languages,
  Mic,
  Sparkles,
  Zap,
  FileText,
  CheckCircle,
} from "lucide-react"

// Add hydration state to prevent SSR mismatch
function useHydration() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}

// Language configurations for patient language (Whisper-supported languages)
const patientLanguages = [
  { code: "auto", name: "Auto Detect", flag: "\u{1F310}" },
  { code: "en", name: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "zh", name: "Chinese", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "es", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "hi", name: "Hindi", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ar", name: "Arabic", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "bn", name: "Bengali", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "pt", name: "Portuguese", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "ru", name: "Russian", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "ja", name: "Japanese", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "de", name: "German", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "ko", name: "Korean", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "fr", name: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "it", name: "Italian", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "tr", name: "Turkish", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "nl", name: "Dutch", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "pl", name: "Polish", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "sv", name: "Swedish", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "vi", name: "Vietnamese", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "th", name: "Thai", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "fa", name: "Persian", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "uk", name: "Ukrainian", flag: "\u{1F1FA}\u{1F1E6}" },
  { code: "ro", name: "Romanian", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "cs", name: "Czech", flag: "\u{1F1E8}\u{1F1FF}" },
  { code: "hu", name: "Hungarian", flag: "\u{1F1ED}\u{1F1FA}" },
  { code: "el", name: "Greek", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "he", name: "Hebrew", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "so", name: "Somali", flag: "\u{1F1F8}\u{1F1F4}" },
  { code: "hmn", name: "Hmong", flag: "\u{1F1F1}\u{1F1E6}" },
  { code: "sw", name: "Swahili", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "tl", name: "Tagalog", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "am", name: "Amharic", flag: "\u{1F1EA}\u{1F1F9}" },
]

// Language configurations for documentation language (Fixed 15 languages)
const docLanguages = [
  { code: "en", name: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "es", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "so", name: "Somali", flag: "\u{1F1F8}\u{1F1F4}" },
  { code: "hmn", name: "Hmong", flag: "\u{1F1F1}\u{1F1E6}" },
  { code: "sw", name: "Swahili", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "fr", name: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "ar", name: "Arabic", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "zh", name: "Chinese (Mandarin)", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "vi", name: "Vietnamese", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "tl", name: "Tagalog", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "pt", name: "Portuguese", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "hi", name: "Hindi", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ru", name: "Russian", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "am", name: "Amharic", flag: "\u{1F1EA}\u{1F1F9}" },
  { code: "ko", name: "Korean", flag: "\u{1F1F0}\u{1F1F7}" },
]

function TranscriptionPageClient() {
  const hydrated = useHydration()
  const { user } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()

  const [transcription, setTranscription] = useState("")
  const [patientId, setPatientId] = useState<string | null>(null)
  const [patientLanguage, setPatientLanguage] = useState("auto")
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [docLanguage, setDocLanguage] = useState("en")
  const [recorderResetSignal, setRecorderResetSignal] = useState(0)

  // Update language preferences when profile loads
  useEffect(() => {
    if (profile) {
      setPatientLanguage(profile.languagePref || "auto")
      setDocLanguage(profile.docLanguage || "en")
    }
  }, [profile])

  // Update profile when language preferences change
  useEffect(() => {
    if (profile && (profile.languagePref !== patientLanguage || profile.docLanguage !== docLanguage)) {
      updateLanguagePreferences(patientLanguage, docLanguage)
    }
  }, [patientLanguage, docLanguage, profile])

  const handleNewPatientSession = async () => {
    if (!user) { router.push("/auth/login"); return }
    try {
      const newPatientId = await createPatientSession(user.uid)
      setPatientId(newPatientId)
    } catch (error) {
      console.error("Error creating patient session:", error)
    }
  }

  const updateLanguagePreferences = async (patientLang: string, docLang: string) => {
    if (!user) return
    try {
      const profileRef = doc(db, "profiles", user.uid)
      await updateDoc(profileRef, {
        languagePref: patientLang,
        docLanguage: docLang,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error("Error updating language preferences:", error)
    }
  }

  const handlePatientLanguageChange = (value: string) => {
    setPatientLanguage(value)
    updateLanguagePreferences(value, docLanguage)
  }

  const handleDocLanguageChange = (value: string) => {
    setDocLanguage(value)
    updateLanguagePreferences(patientLanguage, value)
  }

  const patientLangInfo = patientLanguage === "auto"
    ? (detectedLanguage
        ? patientLanguages.find(l => l.code === detectedLanguage)
        : { flag: "\u{1F310}", name: "Auto Detect" })
    : patientLanguages.find(l => l.code === patientLanguage)
  const docLangInfo = docLanguages.find(l => l.code === docLanguage)

  if (!hydrated) return null

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl" />
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl shadow-inner">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight">
                    AI-Powered Live Transcription
                  </h1>
                  <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                    Record sessions, transcribe in real-time &amp; generate SOAP notes instantly
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400/30 to-yellow-400/30 border border-amber-300/40 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span className="text-xs font-semibold text-amber-100 tracking-wide">AI Enhanced</span>
                <Zap className="h-3 w-3 text-yellow-300" />
              </div>
            </div>

            {/* Active language summary chips */}
            <div className="flex items-center gap-2 mt-3.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-400/25 border border-purple-300/40 rounded-full text-[11px] font-semibold">
                <Globe className="h-3 w-3" />
                Patient: {patientLangInfo?.flag} {patientLangInfo?.name}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-400/25 border border-blue-300/40 rounded-full text-[11px] font-semibold">
                <FileText className="h-3 w-3" />
                Docs: {docLangInfo?.flag} {docLangInfo?.name}
              </span>
              {detectedLanguage && patientLanguage === "auto" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400/25 border border-emerald-300/40 rounded-full text-[11px] font-semibold">
                  <CheckCircle className="h-3 w-3" />
                  Detected: {patientLanguages.find(l => l.code === detectedLanguage)?.flag} {patientLanguages.find(l => l.code === detectedLanguage)?.name}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Language Preferences Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-md p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-500 rounded-t-2xl" />

            <div className="flex items-center gap-2.5 mb-4 mt-1">
              <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <Languages className="h-4 w-4 text-purple-600" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Language Preferences</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Synced with your Settings profile</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Patient Language */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                    <Globe className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </span>
                  Patient Language
                </label>

                {detectedLanguage && patientLanguage === "auto" && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-800">Detected:</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                      {patientLanguages.find(l => l.code === detectedLanguage)?.flag} {patientLanguages.find(l => l.code === detectedLanguage)?.name || "Unknown"}
                    </Badge>
                  </div>
                )}

                <Select value={patientLanguage} onValueChange={handlePatientLanguageChange}>
                  <SelectTrigger className="w-full h-10 bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-purple-400 focus:ring-purple-200 rounded-lg text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{patientLanguages.find(l => l.code === patientLanguage)?.flag}</span>
                      <span>{patientLanguages.find(l => l.code === patientLanguage)?.name || "Select patient language"}</span>
                      {patientLanguage === "auto" && <Badge className="text-[8px] bg-purple-100 text-purple-700 border-purple-200 py-0 px-1.5">Recommended</Badge>}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {patientLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{lang.name}</span>
                          {lang.code === "auto" && (
                            <Badge className="ml-1 text-[9px] bg-purple-100 text-purple-700 border-purple-200">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-500 font-medium">
                  Use &quot;Auto Detect&quot; for automatic language detection
                </p>
              </div>

              {/* Documentation Language */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </span>
                  Documentation Language
                </label>

                <Select value={docLanguage} onValueChange={handleDocLanguageChange}>
                  <SelectTrigger className="w-full h-10 bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-indigo-400 focus:ring-indigo-200 rounded-lg text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{docLanguages.find(l => l.code === docLanguage)?.flag}</span>
                      <span>{docLanguages.find(l => l.code === docLanguage)?.name || "Select documentation language"}</span>
                      {docLanguage === "en" && <Badge className="text-[8px] bg-indigo-100 text-indigo-700 border-indigo-200 py-0 px-1.5">Default</Badge>}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {docLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{lang.name}</span>
                          {lang.code === "en" && (
                            <Badge className="ml-1 text-[9px] bg-indigo-100 text-indigo-700 border-indigo-200">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-500 font-medium">
                  SOAP notes and documentation will be generated in this language
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Transcription & Recording */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-md overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-500 rounded-t-2xl" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Live Transcription &amp; SOAP Note Generation</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Record your session and we'll transcribe it in real-time</p>
                </div>
                <Badge className="ml-auto bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-bold uppercase tracking-wide">
                  <Mic className="h-3 w-3 mr-0.5" /> Live Audio
                </Badge>
              </div>

              <Recorder
                onTranscriptGenerated={(transcript, rawTranscript, detectedPatientLang) => {
                  setTranscription(transcript)
                  if (detectedPatientLang && detectedPatientLang !== "auto") {
                    setDetectedLanguage(detectedPatientLang)
                  }
                }}
                sessionId={patientId || undefined}
                patientLanguage={patientLanguage}
                docLanguage={docLanguage}
                resetSignal={recorderResetSignal}
              />
            </div>
          </div>
        </motion.div>

        {/* SOAP Note Generator */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <SOAPGenerator
            initialTranscript={transcription}
            onClearAll={() => {
              setTranscription("")
              setDetectedLanguage(null)
              setRecorderResetSignal(prev => prev + 1)
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default function TranscriptionPage() {
  return <TranscriptionPageClient />
}
