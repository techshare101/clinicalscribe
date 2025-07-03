"use client"

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
} from "lucide-react"

// Language configurations
const languages = [
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
]

// Mock transcription data
const mockTranscriptions = {
  en: "Patient reports experiencing chest pain for the past 2 hours. Pain is described as sharp and radiating to the left arm. No shortness of breath reported. Patient has a history of hypertension and takes medication regularly. Physical examination reveals blood pressure 150/90, heart rate 88 bpm, temperature 98.6°F. Heart sounds are regular with no murmurs. Lungs are clear to auscultation bilaterally. No peripheral edema noted.",
  es: "El paciente reporta dolor en el pecho durante las últimas 2 horas. El dolor se describe como agudo e irradiándose al brazo izquierdo. No se reporta dificultad para respirar. El paciente tiene antecedentes de hipertensión y toma medicamentos regularmente. El examen físico revela presión arterial 150/90, frecuencia cardíaca 88 lpm, temperatura 98.6°F.",
  fr: "Le patient signale une douleur thoracique depuis 2 heures. La douleur est décrite comme aiguë et irradiant vers le bras gauche. Aucun essoufflement signalé. Le patient a des antécédents d'hypertension et prend des médicaments régulièrement. L'examen physique révèle une pression artérielle de 150/90, une fréquence cardiaque de 88 bpm.",
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export default function TranscriptionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [transcriptionText, setTranscriptionText] = useState("")
  const [translationText, setTranslationText] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [showSOAPGenerator, setShowSOAPGenerator] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioLevelRef = useRef<number>(0)

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
    setTranslationText("")
    setConfidence(0)
    setShowSOAPGenerator(false)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    // Simulate transcription process
    setTimeout(() => {
      const mockText = mockTranscriptions[sourceLanguage as keyof typeof mockTranscriptions] || mockTranscriptions.en
      setTranscriptionText(mockText)
      setCurrentTranscript(mockText)
      setConfidence(languages.find(l => l.code === sourceLanguage)?.confidence || 95)
      
      // Auto-translate if different target language
      if (sourceLanguage !== targetLanguage) {
        setTimeout(() => {
          const targetText = mockTranscriptions[targetLanguage as keyof typeof mockTranscriptions] || mockTranscriptions.en
          setTranslationText(targetText)
        }, 1500)
      }
    }, 2000)
  }

  const handleTranscriptGenerated = (transcript: string) => {
    setCurrentTranscript(transcript)
    setTranscriptionText(transcript)
    setConfidence(95)
    setShowSOAPGenerator(true)
    // Scroll to SOAP generator
    setTimeout(() => {
      const element = document.querySelector('[data-soap-generator]')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <Languages className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100">
              Medical Transcription & Translation
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time multilingual transcription with AI-powered SOAP note generation
          </p>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Configuration
              </CardTitle>
              <CardDescription>
                Select source and target languages for transcription and translation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source Language</label>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {lang.confidence}%
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Language</label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {lang.confidence}%
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recording Interface */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Mic className="h-5 w-5" />
                Live Recording & Transcription
              </CardTitle>
              <CardDescription>
                Record medical consultations with real-time transcription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Recorder onTranscriptGenerated={handleTranscriptGenerated} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Demo Recording Controls */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Demo Recording
              </CardTitle>
              <CardDescription>
                Try the demo with simulated medical transcription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  size="lg"
                  className={`${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white px-8 py-3`}
                >
                  {isRecording ? (
                    <>
                      <Square className="mr-2 h-5 w-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Demo Recording
                    </>
                  )}
                </Button>
              </div>

              {/* Audio Level Indicator */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Volume2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Recording...</span>
                    </div>
                    <Progress value={audioLevel} className="h-2" />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transcription Results */}
        <AnimatePresence>
          {transcriptionText && (
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
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {confidence}% Confidence
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(transcriptionText)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={transcriptionText}
                    onChange={(e) => setTranscriptionText(e.target.value)}
                    className="min-h-[120px] bg-white resize-none"
                    placeholder="Transcription will appear here..."
                  />
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">
                      {transcriptionText.length} characters
                    </span>
                    <Button
                      onClick={generateSOAPFromTranscript}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Generate SOAP Note
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translation Results */}
        <AnimatePresence>
          {translationText && sourceLanguage !== targetLanguage && (
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
                patientName=""
                encounterType="Medical Consultation"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Info */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <CheckCircle className="h-5 w-5" />
                Platform Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}