'use client'

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Recorder from "@/components/Recorder"
import { SOAPGenerator } from "@/components/SOAPGenerator"
import { createPatientSession } from "@/lib/createPatientSession"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Globe, Languages } from "lucide-react"

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
  { code: "auto", name: "Auto Detect", flag: "🌐" },
  // Whisper-supported languages (100+)
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "ro", name: "Romanian", flag: "🇷🇴" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "so", name: "Somali", flag: "🇸🇴" },
  { code: "hmn", name: "Hmong", flag: "🇱🇦" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  // Add more languages as needed
];

// Language configurations for documentation language (Fixed 15 languages)
const docLanguages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "so", name: "Somali", flag: "🇸🇴" },
  { code: "hmn", name: "Hmong", flag: "🇱🇦" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "zh", name: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

// Mock transcription data
const mockTranscriptions = {
  en: "Patient reports experiencing chest pain for the past 2 hours. Pain is described as sharp and radiating to the left arm. No shortness of breath reported. Patient has a history of hypertension and takes medication regularly. Physical examination reveals blood pressure 150/90, heart rate 88 bpm, temperature 98.6°F. Heart sounds are regular with no murmurs. Lungs are clear to auscultation bilaterally. No peripheral edema noted.",
  es: "El paciente reporta dolor en el pecho durante las últimas 2 horas. El dolor se describe como agudo e irradiándose al brazo izquierdo. No se reporta dificultad para respirar. El paciente tiene antecedentes de hipertensión y toma medicamentos regularmente. El examen físico revela presión arterial 150/90, frecuencia cardíaca 88 lpm, temperatura 98.6°F.",
  fr: "Le patient signale une douleur thoracique depuis 2 heures. La douleur est décrite comme aiguë et irradiant vers le bras gauche. Aucun essoufflement signalé. Le patient a des antécédents d'hypertension et prend des médicaments régulièrement. L'examen physique révèle une pression artérielle de 150/90, une fréquence cardiaque de 88 bpm.",
  so: "Waxaan dareemayaa madax wareer oo aan la socday 2 saacadood. Dardii waa la sharaxay sidii adag oo u socota gacanta bidix. Koj tsis muaj mob ntshav tes. Kuv muaj keeb kwm txhais mob los tas tshuaj zoo liab los tas. Kev tshuaj saib yog tshaj 150/90, lub plam 88, kub 98.6°F.",
  hmn: "Kuv mob taub hau los yog 2 teev dhau tshuaj. Kuv mob yog qhov tshaaj tsis muaj nrog rauv tes txaj. Koj tsis muaj mob ntshav tes. Kuv muaj keeb kwm txhais mob los tas tshuaj zoo liab los tas. Kev tshuaj saib yog tshaj 150/90, lub plam 88, kub 98.6°F.",
  sw: "Mgonjwa anasema naumwa kichwa tangu muda saa mbili zilizopita. Maumwa yamelezwa kama mkali na unaenea mkono wa kushoto. Hakuna shida ya kupumua iliyoripotiwa. Mgonjwa ana historia ya shinikizo la damu na hutumia dawa kila siku. Ukayati wa kimwili unaonyesha shinikizo la damu 150/90, mapigo ya moyo 88 kwa dakika, joto 98.6°F."
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

function TranscriptionPageClient() {
  const hydrated = useHydration();
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();

  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientLanguage, setPatientLanguage] = useState("auto");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [docLanguage, setDocLanguage] = useState("en");

  // Update language preferences when profile loads
  useEffect(() => {
    if (profile) {
      setPatientLanguage(profile.languagePref || "auto");
      setDocLanguage(profile.docLanguage || "en");
    }
  }, [profile]);

  // Update profile when language preferences change
  useEffect(() => {
    if (profile && (profile.languagePref !== patientLanguage || profile.docLanguage !== docLanguage)) {
      updateLanguagePreferences(patientLanguage, docLanguage);
    }
  }, [patientLanguage, docLanguage, profile]);

  // This will be passed to the Recorder component
  const handleNewPatientSession = async () => {
    if (!user) {
      // Redirect to login or show an error
      router.push("/auth/login");
      return;
    }
    try {
      const newPatientId = await createPatientSession(user.uid);
      setPatientId(newPatientId);
    } catch (error) {
      console.error("Error creating patient session:", error);
      // Handle error appropriately
    }
  };

  // Update user's language preferences in Firestore
  const updateLanguagePreferences = async (patientLang: string, docLang: string) => {
    if (!user) return;
    
    try {
      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, {
        languagePref: patientLang,
        docLanguage: docLang,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating language preferences:", error);
    }
  };

  // Handle language selection changes
  const handlePatientLanguageChange = (value: string) => {
    setPatientLanguage(value);
    updateLanguagePreferences(value, docLanguage);
  };

  const handleDocLanguageChange = (value: string) => {
    setDocLanguage(value);
    updateLanguagePreferences(patientLanguage, value);
  };

  if (!hydrated) {
    return null; // or a loading spinner
  }

  return (
    <div className="container mx-auto p-4">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8"
      >
        {/* Language Selection Card with Glassmorphic Effect */}
        <Card className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <Languages className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Language Preferences
                </span>
              </div>
            </CardTitle>
            <CardDescription className="text-gray-800 ml-11">
              Select the patient's spoken language and your preferred documentation language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Patient Language Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Patient Language</h3>
                </div>
                
                {/* Detected Language Display */}
                {detectedLanguage && patientLanguage === "auto" && (
                  <div className="p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 border border-green-200/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-green-900">Detected:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-900 border-green-300 font-medium">
                        {patientLanguages.find(l => l.code === detectedLanguage)?.flag} {patientLanguages.find(l => l.code === detectedLanguage)?.name || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <Select 
                  value={patientLanguage} 
                  onValueChange={handlePatientLanguageChange}
                >
                  <SelectTrigger className="w-full bg-white/30 backdrop-blur-md border-2 border-purple-200/50 focus:border-purple-500 focus:ring-purple-500 rounded-xl py-6 text-base font-medium text-gray-900 shadow-lg">
                    <SelectValue placeholder="Select patient language" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 backdrop-blur-lg border border-purple-200/50">
                    {patientLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-3 py-2">
                          <span className="text-lg">{lang.flag}</span>
                          <span className="font-medium text-gray-900">{lang.name}</span>
                          {lang.code === "auto" && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-800">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-700 font-medium">
                  Select the language your patient speaks. Use "Auto Detect" for automatic detection.
                </p>
              </div>

              {/* Documentation Language Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Documentation Language</h3>
                </div>
                <Select 
                  value={docLanguage} 
                  onValueChange={handleDocLanguageChange}
                >
                  <SelectTrigger className="w-full bg-white/30 backdrop-blur-md border-2 border-blue-200/50 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-6 text-base font-medium text-gray-900 shadow-lg">
                    <SelectValue placeholder="Select documentation language" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 backdrop-blur-lg border border-blue-200/50">
                    {docLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-3 py-2">
                          <span className="text-lg">{lang.flag}</span>
                          <span className="font-medium text-gray-900">{lang.name}</span>
                          {lang.code === "en" && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-800">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-700 font-medium">
                  Select the language for your clinical documentation. Defaults to English.
                </p>
              </div>
            </div>

            {/* Language Info Badges */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Badge className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-900 border-purple-200/50 px-4 py-2 text-base font-semibold rounded-full backdrop-blur-sm">
                <Globe className="h-4 w-4 mr-2" />
                Patient: {patientLanguage === "auto" ? (
                  detectedLanguage ? 
                  `${patientLanguages.find(l => l.code === detectedLanguage)?.flag} ${patientLanguages.find(l => l.code === detectedLanguage)?.name}` : 
                  "🌐 Auto Detect (Recommended)"
                ) : `${patientLanguages.find(l => l.code === patientLanguage)?.flag} ${patientLanguages.find(l => l.code === patientLanguage)?.name}`}
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-900 border-blue-200/50 px-4 py-2 text-base font-semibold rounded-full backdrop-blur-sm">
                <Languages className="h-4 w-4 mr-2" />
                Documentation: {docLanguages.find(l => l.code === docLanguage)?.flag} {docLanguages.find(l => l.code === docLanguage)?.name}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Live Transcription & SOAP Note Generation</CardTitle>
            <CardDescription>
              Record your patient encounter, and we'll transcribe it in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Recorder
              onTranscriptGenerated={(transcript, rawTranscript, detectedPatientLang) => {
                setTranscription(transcript);
                // Update detected language if returned from Whisper
                if (detectedPatientLang && detectedPatientLang !== "auto") {
                  setDetectedLanguage(detectedPatientLang);
                }
              }}
              sessionId={patientId || undefined}
              patientLanguage={patientLanguage}
              docLanguage={docLanguage}
            />
          </CardContent>
        </Card>

        <Separator />

        <SOAPGenerator initialTranscript={transcription} />
      </motion.div>
    </div>
  );
}

export default function TranscriptionPage() {
  return <TranscriptionPageClient />;
}
