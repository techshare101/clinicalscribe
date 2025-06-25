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
  en: "Patient reports experiencing chest pain for the past 2 hours. Pain is described as sharp and radiating to the left arm. No shortness of breath reported. Patient has a history of hypertension and takes medication regularly.",
  es: "El paciente reporta dolor en el pecho durante las últimas 2 horas. El dolor se describe como agudo e irradiándose al brazo izquierdo. No se reporta dificultad para respirar. El paciente tiene antecedentes de hipertensión y toma medicamentos regularmente.",
  fr: "Le patient signale une douleur thoracique depuis 2 heures. La douleur est décrite comme aiguë et irradiant vers le bras gauche. Aucun essoufflement signalé. Le patient a des antécédents d'hypertension et prend des médicaments régulièrement.",
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export default function MultilingualTranscription() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [transcriptionText, setTranscriptionText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const recordingInterval = useRef<NodeJS.Timeout>()
  const audioLevelInterval = useRef<NodeJS.Timeout>()

  // Simulate recording timer
  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Simulate audio level fluctuation
      audioLevelInterval.current = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)
    } else {
      if (recordingInterval.current) clearInterval(recordingInterval.current)
      if (audioLevelInterval.current) clearInterval(audioLevelInterval.current)
      setAudioLevel(0)
    }

    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current)
      if (audioLevelInterval.current) clearInterval(audioLevelInterval.current)
    }
  }, [isRecording])

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    setTranscriptionText("")
    setTranslatedText("")
    setConfidence(0)
    setDetectedLanguage(null)
  }

  const stopRecording = () => {
    setIsRecording(false)
    // Simulate transcription process
    setTimeout(() => {
      const mockText = mockTranscriptions[sourceLanguage as keyof typeof mockTranscriptions] || mockTranscriptions.en
      setTranscriptionText(mockText)
      setConfidence(languages.find((l) => l.code === sourceLanguage)?.confidence || 95)
      setDetectedLanguage(sourceLanguage)

      // Auto-translate after transcription
      setTimeout(() => {
        setIsTranslating(true)
        setTimeout(() => {
          const targetMockText =
            mockTranscriptions[targetLanguage as keyof typeof mockTranscriptions] || mockTranscriptions.en
          setTranslatedText(targetMockText)
          setIsTranslating(false)
        }, 2000)
      }, 1000)
    }, 1500)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const getLanguageByCode = (code: string) => {
    return languages.find((l) => l.code === code)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Languages className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">🔤 Multilingual Transcription Studio</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Record patient conversations in any language and get instant transcription with real-time translation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recording Controls */}
          <motion.div {...fadeInUp} className="lg:col-span-1">
            <Card className="h-fit sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">🎙️ Recording Controls</CardTitle>
                <CardDescription>Start recording and configure languages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">🗣️ Source Language</label>
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
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">🌍 Target Language</label>
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
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Recording Interface */}
                <div className="text-center space-y-4">
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl transition-all ${
                        isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                    </motion.button>

                    {isRecording && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -inset-2 border-4 border-red-300 rounded-full animate-ping"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-2xl font-mono font-bold text-gray-900">{formatTime(recordingTime)}</div>
                    <div className="text-sm text-gray-600">{isRecording ? "🔴 Recording..." : "⏸️ Ready to record"}</div>
                  </div>

                  {/* Audio Level Indicator */}
                  {isRecording && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-gray-600" />
                        <div className="flex-1">
                          <Progress value={audioLevel} className="h-2" />
                        </div>
                      </div>
                      <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: audioLevel > i * 20 ? [4, 16, 4] : 4,
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: Number.POSITIVE_INFINITY,
                              delay: i * 0.1,
                            }}
                            className="w-1 bg-blue-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Transcription Results */}
          <motion.div {...fadeInUp} className="lg:col-span-2 space-y-6">
            {/* Language Detection */}
            <AnimatePresence>
              {detectedLanguage && (
                <motion.div {...fadeInUp}>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <div className="font-medium text-green-900">Language Detected</div>
                          <div className="text-sm text-green-700">
                            {getLanguageByCode(detectedLanguage)?.flag} {getLanguageByCode(detectedLanguage)?.name}
                            <Badge variant="secondary" className="ml-2">
                              {confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Original Transcription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    📝 Original Transcription
                    {getLanguageByCode(sourceLanguage) && (
                      <Badge variant="outline">
                        {getLanguageByCode(sourceLanguage)?.flag} {getLanguageByCode(sourceLanguage)?.name}
                      </Badge>
                    )}
                  </div>
                  {transcriptionText && (
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(transcriptionText)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transcriptionText ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <Textarea
                      value={transcriptionText}
                      onChange={(e) => setTranscriptionText(e.target.value)}
                      className="min-h-[120px] text-base leading-relaxed"
                      placeholder="Transcribed text will appear here..."
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>📊 Confidence: {confidence}%</span>
                        <span>📝 {transcriptionText.split(" ").length} words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Volume2 className="h-4 w-4 mr-1" />
                          Play
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start recording to see transcription results</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Translation Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    🌍 Translation Preview
                    {getLanguageByCode(targetLanguage) && (
                      <Badge variant="outline">
                        {getLanguageByCode(targetLanguage)?.flag} {getLanguageByCode(targetLanguage)?.name}
                      </Badge>
                    )}
                  </div>
                  {translatedText && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(translatedText)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isTranslating ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="inline-block"
                    >
                      <Languages className="h-8 w-8 text-blue-600" />
                    </motion.div>
                    <p className="mt-4 text-gray-600">🔄 Translating...</p>
                    <Progress value={66} className="w-48 mx-auto mt-2" />
                  </motion.div>
                ) : translatedText ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <Textarea
                      value={translatedText}
                      onChange={(e) => setTranslatedText(e.target.value)}
                      className="min-h-[120px] text-base leading-relaxed"
                      placeholder="Translation will appear here..."
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>🎯 Translation Quality: High</span>
                        <span>📝 {translatedText.split(" ").length} words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Volume2 className="h-4 w-4 mr-1" />
                          Play
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : transcriptionText ? (
                  <div className="text-center py-12 text-gray-500">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Translation will appear automatically</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Record audio to see translation</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SOAP Note Generation */}
            <AnimatePresence>
              {translatedText && (
                <motion.div {...fadeInUp}>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">🧾 Generate SOAP Note</CardTitle>
                      <CardDescription>Convert your transcription into a structured clinical note</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Button className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate from Original
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Globe className="h-4 w-4 mr-2" />
                          Generate from Translation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowSettings(false)}
            >
              <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <CardHeader>
                  <CardTitle>⚙️ Transcription Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Audio Quality</label>
                    <Select defaultValue="high">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (faster)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Auto-translate</label>
                    <Select defaultValue="enabled">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => setShowSettings(false)} className="w-full">
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
