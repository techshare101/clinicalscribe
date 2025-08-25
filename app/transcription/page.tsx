'use client'

import { useState, useRef, useEffect } from "react"
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
import {
  Mic,
  Square,
  Languages,
  Volume2,
  Download,
  Copy,
  Settings,
  Globe,
  FileText,
  CheckCircle,
  RefreshCw,
  Stethoscope,
  ArrowRight,
  Sparkles,
  Trash2,
  AlertTriangle,
} from "lucide-react"

// Language configurations
const languages = [
  { code: "auto", name: "Auto Detect", flag: "🌐", confidence: 100 },
  { code: "en", name: "English", flag: "🇺🇸", confidence: 98 },
  { code: "es", name: "Spanish", flag: "🇪🇸", confidence: 95 },
  { code: "fr", name: "French", flag: "🇫🇷", confidence: 92 },
  { code: "de", name: "German", flag: "🇩🇪", confidence: 90 },
  { code: "it", name: "Italian", flag: "🇮🇹", confidence: 88 },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", confidence: 94 },
  { code: "zh", name: "Chinese", flag: "🇨🇳", confidence: 87 },
  { code: "ja", name: "Japanese", flag: "🇯🇵", confidence: 85 },
  { code: "ko", name: "Korean", flag: "🇰🇷", confidence: 83 },
  { code: "ar", name: "Arabic", flag: "🇸🇦", confidence: 89 },
  { code: "so", name: "Somali", flag: "🇸🇴", confidence: 90 },
  { code: "hmn", name: "Hmong", flag: "🇱🇦", confidence: 85 },
  { code: "sw", name: "Swahili", flag: "🇰🇪", confidence: 88 },
]

// Mock transcription data
const mockTranscriptions = {
  en: "Patient reports experiencing chest pain for the past 2 hours. Pain is described as sharp and radiating to the left arm. No shortness of breath reported. Patient has a history of hypertension and takes medication regularly. Physical examination reveals blood pressure 150/90, heart rate 88 bpm, temperature 98.6°F. Heart sounds are regular with no murmurs. Lungs are clear to auscultation bilaterally. No peripheral edema noted.",
  es: "El paciente reporta dolor en el pecho durante las últimas 2 horas. El dolor se describe como agudo e irradiándose al brazo izquierdo. No se reporta dificultad para respirar. El paciente tiene antecedentes de hipertensión y toma medicamentos regularmente. El examen físico revela presión arterial 150/90, frecuencia cardíaca 88 lpm, temperatura 98.6°F.",
  fr: "Le patient signale une douleur thoracique depuis 2 heures. La douleur est décrite comme aiguë et irradiant vers le bras gauche. Aucun essoufflement signalé. Le patient a des antécédents d'hypertension et prend des médicaments régulièrement. L'examen physique révèle une pression artérielle de 150/90, une fréquence cardiaque de 88 bpm.",
  so: "Waxaan dareemayaa madax wareer oo aan la socday 2 saacadood. Dardii waa la sharaxay sidii adag oo u socota gacanta bidix. Ma jiro shaki kharash ah oo lagu tilmaamay. Daryeelka ayaa la yaab leh taariikhda iyo daawooyinka si joogto ah. Baajinka jiray waxaa muujiya dhibaatada dhiigga 150/90, lub plam 88, kub 98.6°F.",
  hmn: "Kuv mob taub hau los yog 2 teev dhau tshuaj. Kuv mob yog qhov tshaaj tsis muaj nrog rauv tes txaj. Koj tsis muaj mob ntshav tes. Kuv muaj keeb kwm txhais mob los tas tshuaj zoo liab los tas. Kev tshuaj saib yog tshaj 150/90, lub plam 88, kub 98.6°F.",
  sw: "Mgonjwa anasema naumwa kichwa tangu muda saa mbili zilizopita. Maumwa yamelezwa kama mkali na unaenea mkono wa kushoto. Hakuna shida ya kupumua iliyoripotiwa. Mgonjwa ana historia ya shinikizo la damu na hutumia dawa kila siku. Ukayati wa kimwili unaonyesha shinikizo la damu 150/90, mapigo ya moyo 88 kwa dakika, joto 98.6°F."
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export default function TranscriptionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [patientLanguage, setPatientLanguage] = useState("auto")
  const [docLanguage, setDocLanguage] = useState("en")
  const [transcriptionText, setTranscriptionText] = useState("")
  const [rawTranscriptionText, setRawTranscriptionText] = useState("")
  const [translationText, setTranslationText] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [currentRawTranscript, setCurrentRawTranscript] = useState("")
  const [showSOAPGenerator, setShowSOAPGenerator] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [showRawTranscript, setShowRawTranscript] = useState(false)
  const [restored, setRestored] = useState(false) // Track if data was restored from localStorage
  const audioLevelRef = useRef<number>(0)

  // Load transcript data from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("currentTranscript")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setRawTranscriptionText(data.rawTranscript || "")
        setTranscriptionText(data.transcript || "")
        setCurrentTranscript(data.transcript || "")
        setCurrentRawTranscript(data.rawTranscript || "")
        setPatientLanguage(data.patientLang || "auto")
        setDocLanguage(data.docLang || "en")
        setConfidence(data.confidence || 95)
        setShowSOAPGenerator(!!data.transcript)
        setRestored(true)
      } catch (error) {
        console.error("Failed to parse saved transcript data:", error)
        localStorage.removeItem("currentTranscript") // Clear corrupted data
      }
    }
  }, [])

  // Save transcript data to localStorage whenever it changes
  useEffect(() => {
    if (transcriptionText || rawTranscriptionText) {
      const transcriptData = {
        rawTranscript: rawTranscriptionText,
        transcript: transcriptionText,
        patientLang: patientLanguage,
        docLang: docLanguage,
        confidence: confidence,
      }
      localStorage.setItem("currentTranscript", JSON.stringify(transcriptData))
    }
  }, [rawTranscriptionText, transcriptionText, patientLanguage, docLanguage, confidence])

  // Simulate audio level animation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        audioLevelRef.current = Math.random() * 100
        setAudioLevel(audioLevelRef.current)
      }, 100)
    } else {
      setAudioLevel(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const handleStartRecording = () => {
    setIsRecording(true)
    setTranscriptionText("")
    setRawTranscriptionText("")
    setTranslationText("")
    setConfidence(0)
    setShowSOAPGenerator(false)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    // Simulate transcription process
    setTimeout(() => {
      const mockText = mockTranscriptions[patientLanguage as keyof typeof mockTranscriptions] || mockTranscriptions.en
      setTranscriptionText(mockText)
      setRawTranscriptionText(mockText)
      setCurrentTranscript(mockText)
      setCurrentRawTranscript(mockText)
      setConfidence(languages.find(l => l.code === patientLanguage)?.confidence || 95)
      
      // Auto-translate if different target language
      if (patientLanguage !== docLanguage) {
        setTimeout(() => {
          const targetText = mockTranscriptions[docLanguage as keyof typeof mockTranscriptions] || mockTranscriptions.en
          setTranslationText(targetText)
        }, 1500)
      }
    }, 2000)
  }

  const handleTranscriptGenerated = (transcript: string, rawTranscript: string, patientLang?: string, docLang?: string) => {
    setCurrentTranscript(transcript);
    setCurrentRawTranscript(rawTranscript);
    setTranscriptionText(transcript);
    setRawTranscriptionText(rawTranscript);
    
    // Update language information if provided
    if (patientLang) setPatientLanguage(patientLang);
    if (docLang) setDocLanguage(docLang);
    
    setConfidence(95);
    setShowSOAPGenerator(true);
    setRestored(false); // New transcript, not restored
    // Scroll to SOAP generator
    setTimeout(() => {
      const element = document.querySelector('[data-soap-generator]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  const generateSOAPFromTranscript = () => {
    setShowSOAPGenerator(true)
    setTimeout(() => {
      const element = document.querySelector('[data-soap-generator]')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Clear all transcript data
  const clearTranscriptData = () => {
    setTranscriptionText("")
    setRawTranscriptionText("")
    setTranslationText("")
    setCurrentTranscript("")
    setCurrentRawTranscript("")
    setConfidence(0)
    setShowSOAPGenerator(false)
    setRestored(false)
    localStorage.removeItem("currentTranscript")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-300/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl ring-4 ring-blue-200/50">
                <Languages className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent drop-shadow-sm">
                Medical Transcription
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg">
                  <Mic className="h-3 w-3 mr-1" />
                  Real-time
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                  <Languages className="h-3 w-3 mr-1" />
                  Multilingual
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </div>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            Transform medical conversations into structured documentation with 
            <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">advanced AI transcription</span>
          </motion.p>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl ring-2 ring-white/30"
                  >
                    <Globe className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-black text-white">Language Configuration</h3>
                    <p className="text-blue-100 font-medium">Select patient language and documentation language</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                    Patient Language
                  </label>
                  <Select value={patientLanguage} onValueChange={setPatientLanguage}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{lang.flag}</span>
                            <span className="font-medium">{lang.name}</span>
                            <Badge className="ml-auto bg-emerald-100 text-emerald-800 border-emerald-200">
                              {lang.confidence}%
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    The language the patient will speak in
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Documentation Language
                  </label>
                  <Select value={docLanguage} onValueChange={setDocLanguage}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{lang.flag}</span>
                            <span className="font-medium">{lang.name}</span>
                            <Badge className="ml-auto bg-blue-100 text-blue-800 border-blue-200">
                              {lang.confidence}%
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    The language for SOAP notes and documentation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recording Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Mic className="h-5 w-5" />
                🎙️ Voice Recording
              </CardTitle>
              <CardDescription>
                Record patient conversations for automatic transcription and clinical documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Recorder 
                onTranscriptGenerated={handleTranscriptGenerated} 
                patientLanguage={patientLanguage}
                docLanguage={docLanguage}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Restoration Warning */}
        <AnimatePresence>
          {restored && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2"
            >
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">Restored saved transcript</span> - Data was automatically restored from your previous session. 
                Clear manually before starting a new session.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcription Results */}
        <AnimatePresence>
          {(transcriptionText || rawTranscriptionText) && (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-8"
            >
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <FileText className="h-5 w-5" />
                      Transcription Result
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Confidence: {confidence}%
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(transcriptionText)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearTranscriptData}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      Patient: {
                        patientLanguage === "auto" ? "🌐 Auto Detect" :
                        patientLanguage === "so" ? "🇸🇴 Somali" :
                        patientLanguage === "hmn" ? "🇱🇦 Hmong" :
                        patientLanguage === "sw" ? "🇰🇪 Swahili" :
                        patientLanguage === "ar" ? "🇸🇦 Arabic" :
                        patientLanguage === "en" ? "🇺🇸 English" :
                        `${languages.find(l => l.code === patientLanguage)?.name || 'Unknown'} (${patientLanguage.toUpperCase()})`
                      }
                    </Badge>
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                      Documentation: {
                        docLanguage === "en" ? "🇺🇸 English" :
                        docLanguage === "so" ? "🇸🇴 Somali" :
                        docLanguage === "hmn" ? "🇱🇦 Hmong" :
                        docLanguage === "sw" ? "🇰🇪 Swahili" :
                        docLanguage === "ar" ? "🇸🇦 Arabic" :
                        `${languages.find(l => l.code === docLanguage)?.name || 'Unknown'} (${docLanguage.toUpperCase()})`
                      }
                    </Badge>
                  </div>
                  
                  {rawTranscriptionText && (
                    <div className="mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRawTranscript(!showRawTranscript)}
                        className="mb-2"
                      >
                        {showRawTranscript ? 'Show Translated Transcript' : 'Show Raw Transcript'}
                      </Button>
                      {showRawTranscript && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <h4 className="font-bold text-yellow-800 mb-1">
                            Raw Transcript ({
                              patientLanguage === "auto" ? "🌐 Auto Detected" :
                              patientLanguage === "so" ? "🇸🇴 Somali" :
                              patientLanguage === "hmn" ? "🇱🇦 Hmong" :
                              patientLanguage === "sw" ? "🇰🇪 Swahili" :
                              patientLanguage === "ar" ? "🇸🇦 Arabic" :
                              patientLanguage === "en" ? "🇺🇸 English" :
                              languages.find(l => l.code === patientLanguage)?.name || patientLanguage.toUpperCase()
                            }):
                          </h4>
                          <p className="text-yellow-700 text-sm">{rawTranscriptionText}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Textarea
                    value={showRawTranscript ? rawTranscriptionText : transcriptionText}
                    onChange={(e) => showRawTranscript ? setRawTranscriptionText(e.target.value) : setTranscriptionText(e.target.value)}
                    className="min-h-[120px] bg-white resize-none"
                    placeholder={showRawTranscript ? "Raw transcript will appear here..." : "Translated transcript will appear here..."}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      {showRawTranscript 
                        ? `Patient Language: ${
                            patientLanguage === "auto" ? "🌐 Auto Detected" :
                            patientLanguage === "so" ? "🇸🇴 Somali" :
                            patientLanguage === "hmn" ? "🇱🇦 Hmong" :
                            patientLanguage === "sw" ? "🇰🇪 Swahili" :
                            patientLanguage === "ar" ? "🇸🇦 Arabic" :
                            patientLanguage === "en" ? "🇺🇸 English" :
                            languages.find(l => l.code === patientLanguage)?.name || patientLanguage
                          }`
                        : `Translated to ${
                            docLanguage === "en" ? "🇺🇸 English" :
                            docLanguage === "so" ? "🇸🇴 Somali" :
                            docLanguage === "hmn" ? "🇱🇦 Hmong" :
                            docLanguage === "sw" ? "🇰🇪 Swahili" :
                            docLanguage === "ar" ? "🇸🇦 Arabic" :
                            languages.find(l => l.code === docLanguage)?.name || docLanguage
                          }`
                      }
                    </div>
                    <Button
                      onClick={generateSOAPFromTranscript}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Stethoscope className="h-4 w-4" />
                      Generate SOAP Note
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translation Results */}
        <AnimatePresence>
          {translationText && patientLanguage !== docLanguage && (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-8"
            >
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                      <Languages className="h-5 w-5" />
                      Translation Result
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(translationText)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={translationText}
                    onChange={(e) => setTranslationText(e.target.value)}
                    className="min-h-[120px] bg-white resize-none"
                    placeholder="Translation will appear here..."
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SOAP Generator */}
        <AnimatePresence>
          {showSOAPGenerator && currentTranscript && (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-8"
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 text-center justify-center">
                  <Separator className="flex-1" />
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">AI SOAP Generation</span>
                  </div>
                  <Separator className="flex-1" />
                </div>
              </div>
              
              <SOAPGenerator 
                initialTranscript={currentTranscript}
                initialRawTranscript={currentRawTranscript}
                patientName=""
                encounterType={`${languages.find(l => l.code === docLanguage)?.name || 'Unknown'} Consultation`}
                patientLang={patientLanguage}
                docLang={docLanguage}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear Button Section */}
        {(transcriptionText || rawTranscriptionText || showSOAPGenerator) && (
          <div className="flex justify-center mb-8">
            <Button
              onClick={clearTranscriptData}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300 rounded-2xl shadow-sm"
            >
              <Trash2 className="h-5 w-5" />
              Clear All Transcript Data
            </Button>
          </div>
        )}

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              <div className="relative flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl ring-2 ring-white/30"
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-black text-white">Advanced Features</h3>
                  <p className="text-amber-100 font-medium">Powered by cutting-edge AI technology</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">Real-time Transcription</h4>
                  <ul className="space-y-1 text-amber-800">
                    <li>• Live audio processing</li>
                    <li>• Multi-language support</li>
                    <li>• High accuracy rates</li>
                    <li>• Noise reduction</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">AI Translation</h4>
                  <ul className="space-y-1 text-amber-800">
                    <li>• 10+ language pairs</li>
                    <li>• Medical terminology</li>
                    <li>• Context-aware translation</li>
                    <li>• Quality confidence scores</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">SOAP Generation</h4>
                  <ul className="space-y-1 text-amber-800">
                    <li>• Structured clinical notes</li>
                    <li>• Professional formatting</li>
                    <li>• Export capabilities</li>
                    <li>• Copy individual sections</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}