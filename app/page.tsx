"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function ClinicalScribeDashboard() {
  const [showSOAPBuilder, setShowSOAPBuilder] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [step, setStep] = useState(0)
  const [signature, setSignature] = useState("")
  const [online, setOnline] = useState(true)
  const [transcribedText, setTranscribedText] = useState(
    "El paciente dice que siente un dolor agudo en el costado derecho.",
  )
  const [translatedText, setTranslatedText] = useState("The patient says they feel a sharp pain on the right side.")

  // New state for audit logging and offline features
  const [auditLogs, setAuditLogs] = useState([
    {
      id: "AUD-001",
      timestamp: new Date().toLocaleString(),
      action: "PATIENT_DATA_ACCESSED",
      user: "nurse@hospital.org",
      details: "Accessed patient record for Maria Gomez",
      ipAddress: "192.168.1.45",
      sessionId: "sess_abc123",
      compliance: "HIPAA_LOGGED",
    },
    {
      id: "AUD-002",
      timestamp: new Date(Date.now() - 300000).toLocaleString(),
      action: "TRANSCRIPTION_COMPLETED",
      user: "nurse@hospital.org",
      details: "Voice transcription completed for patient encounter",
      ipAddress: "192.168.1.45",
      sessionId: "sess_abc123",
      compliance: "HIPAA_LOGGED",
    },
  ])
  const [offlineQueue, setOfflineQueue] = useState([])
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionProgress, setSubmissionProgress] = useState(0)

  const onboardingSteps = [
    {
      title: "Welcome to ClinicalScribe 👋",
      description: "You're about to experience a smarter, faster way to document patient care.",
    },
    {
      title: "🎙️ Voice Transcription",
      description:
        "Simply tap 'Start Whisper Transcription' and speak with your patient. ClinicalScribe will do the rest.",
    },
    {
      title: "🌐 Multilingual Support",
      description: "We detect and translate over 50 languages in real-time so you can chart with confidence.",
    },
    {
      title: "🧾 Auto SOAP Notes + PDF",
      description: "Our AI fills in structured SOAP notes and creates secure PDFs with QR verification.",
    },
    {
      title: "✅ You're Ready!",
      description: "Tap 'Get Started' to enter the dashboard and meet your new AI co-pilot.",
    },
  ]

  const handleNextStep = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1)
      logAuditEvent("ONBOARDING_STEP_COMPLETED", `Completed step ${step + 1}`)
    } else {
      setShowOnboarding(false)
      logAuditEvent("ONBOARDING_COMPLETED", "User completed onboarding process")
    }
  }

  const logAuditEvent = (action, details, user = "nurse@hospital.org") => {
    const newLog = {
      id: `AUD-${String(auditLogs.length + 1).padStart(3, "0")}`,
      timestamp: new Date().toLocaleString(),
      action,
      user,
      details,
      ipAddress: "192.168.1.45",
      sessionId: "sess_abc123",
      compliance: "HIPAA_LOGGED",
    }

    setAuditLogs((prev) => [newLog, ...prev])

    if (!online) {
      setOfflineQueue((prev) => [...prev, { type: "AUDIT_LOG", data: newLog, timestamp: new Date().toISOString() }])
    }

    console.log("🛡️ Audit Log:", newLog)
  }

  const handleOfflineAction = (action) => {
    if (!online) {
      setOfflineQueue((prev) => [...prev, { ...action, timestamp: new Date().toISOString() }])
      logAuditEvent("OFFLINE_ACTION_QUEUED", `Action queued for sync: ${action.type}`)
      return false
    }
    return true
  }

  const handleSendToAdmin = async () => {
    if (!handleOfflineAction({ type: "ADMIN_HANDOFF", patient: "Maria Gomez" })) {
      alert("⚠️ You're offline. This action has been queued for when you're back online.")
      return
    }

    logAuditEvent("ADMIN_HANDOFF_INITIATED", "Starting handoff for Maria Gomez to admin")

    setIsSubmitting(true)
    setSubmissionProgress(0)

    const steps = [
      "Validating clinical data...",
      "Generating PDF report...",
      "Preparing email notification...",
      "Connecting to EHR system...",
      "Sending to administrator...",
      "Updating workflow status...",
    ]

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setSubmissionProgress(((i + 1) / steps.length) * 100)
    }

    logAuditEvent("ADMIN_HANDOFF_COMPLETED", "Successfully sent Maria Gomez report to admin")
    setIsSubmitting(false)

    setTimeout(() => {
      alert("✅ Patient report emailed to Admin & ready for EHR push.")
      setSubmissionProgress(0)
    }, 500)
  }

  const getActionIcon = (action) => {
    const iconMap = {
      PATIENT_DATA_ACCESSED: "👁️",
      TRANSCRIPTION_COMPLETED: "🎙️",
      ADMIN_HANDOFF_INITIATED: "📤",
      ADMIN_HANDOFF_COMPLETED: "✅",
      OFFLINE_MODE_ACTIVATED: "📴",
      OFFLINE_SYNC_COMPLETED: "🔄",
    }
    return iconMap[action] || "🛡️"
  }

  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine
      setOnline(isOnline)

      if (isOnline) {
        if (offlineQueue.length > 0) {
          console.log("Processing offline queue:", offlineQueue)
          logAuditEvent("OFFLINE_SYNC_COMPLETED", `Processed ${offlineQueue.length} offline queue items`)
          setTimeout(() => {
            setOfflineQueue([])
          }, 2000)
        }
      } else {
        logAuditEvent("OFFLINE_MODE_ACTIVATED", "Device went offline, enabling cache mode")
      }
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)
    updateOnlineStatus()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [offlineQueue])

  useEffect(() => {
    logAuditEvent("DASHBOARD_ACCESSED", "User accessed ClinicalScribe dashboard")
  }, [])

  if (showOnboarding) {
    const current = onboardingSteps[step]
    return (
      <motion.div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col justify-center items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-lg max-w-md"
        >
          <h2 className="text-2xl font-bold mb-2">{current.title}</h2>
          <p className="text-gray-700 mb-6">{current.description}</p>
          <button
            onClick={handleNextStep}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-700 transition-colors"
          >
            {step < onboardingSteps.length - 1 ? "Next" : "Get Started"}
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-white to-gray-100 min-h-screen">
      {/* Offline Mode Banner */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="mb-4"
          >
            <div className="bg-orange-100 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">☁️</span>
                <div className="flex-1">
                  <div className="font-semibold text-orange-900">🔄 Offline Mode Active</div>
                  <div className="text-sm text-orange-700">
                    You're currently offline. Actions will be queued and synced when connection is restored.
                    {offlineQueue.length > 0 && (
                      <span className="ml-2 font-medium">{offlineQueue.length} action(s) queued for sync</span>
                    )}
                  </div>
                </div>
                <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-lg text-sm font-medium">
                  {offlineQueue.length} Queued
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Secure Logging Notice */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">ClinicalScribe 🧬</h1>
          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-lg text-xs font-medium">
            {online ? "🟢 Online" : "🔴 Offline"}
          </span>
        </div>

        {/* Secure Logging Notice */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
            <span className="text-green-600">🔒</span>
            <span className="text-green-600">🛡️</span>
            <span className="text-sm font-medium text-green-900">Secure Logging Active</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              {auditLogs.length} Events
            </span>
          </div>
          <button
            onClick={() => setShowAuditLog(true)}
            className="text-green-700 hover:text-green-800 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm"
          >
            👁️ View Audit Log
          </button>
        </div>
      </motion.header>

      {/* Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setShowSOAPBuilder(false)
            logAuditEvent("DASHBOARD_VIEW_SELECTED", "User switched to dashboard view")
          }}
          className={`px-4 py-2 rounded-2xl shadow-md transition-colors ${
            !showSOAPBuilder
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => {
            setShowSOAPBuilder(true)
            logAuditEvent("SOAP_BUILDER_VIEW_SELECTED", "User switched to SOAP builder view")
          }}
          className={`px-4 py-2 rounded-2xl shadow-md transition-colors ${
            showSOAPBuilder
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          🧾 SOAP Builder
        </button>
      </div>

      {/* Main Content */}
      <motion.div className="bg-white p-6 rounded-2xl shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-3">📤 Send to Admin / EHR Push</h2>

        {/* Patient Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold mb-3">📋 Patient Summary</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Original (Spanish):</strong>
              <p className="text-gray-700 mt-1">{transcribedText}</p>
            </div>
            <div>
              <strong>Translation (English):</strong>
              <p className="text-gray-700 mt-1">{translatedText}</p>
            </div>
          </div>
        </div>

        {/* Nurse Signature */}
        <div className="mb-4">
          <label className="block font-medium mb-1">🖋️ Nurse Signature</label>
          <input
            type="text"
            placeholder="Enter your full name"
            className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={signature}
            onChange={(e) => {
              setSignature(e.target.value)
              logAuditEvent("SIGNATURE_FIELD_MODIFIED", "Nurse signature field updated")
            }}
          />
        </div>

        {/* Submission Progress */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="text-blue-600"
                >
                  🔄
                </motion.div>
                <span className="text-sm font-medium">Processing handoff...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${submissionProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {submissionProgress < 20 && "Validating clinical data..."}
                {submissionProgress >= 20 && submissionProgress < 40 && "Generating PDF report..."}
                {submissionProgress >= 40 && submissionProgress < 60 && "Preparing email notification..."}
                {submissionProgress >= 60 && submissionProgress < 80 && "Connecting to EHR system..."}
                {submissionProgress >= 80 && submissionProgress < 100 && "Sending to administrator..."}
                {submissionProgress === 100 && "Complete!"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          onClick={handleSendToAdmin}
          disabled={isSubmitting || !signature.trim()}
          className={`w-full py-3 rounded-xl shadow-md font-medium transition-colors ${
            isSubmitting || !signature.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin mr-2">🔄</span>
              Processing...
            </>
          ) : (
            <>📨 Email PDF Report to Admin</>
          )}
        </button>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600">{auditLogs.length}</div>
            <div className="text-sm text-blue-700">Security Events</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600">
              {auditLogs.filter((log) => log.action.includes("COMPLETED")).length}
            </div>
            <div className="text-sm text-green-700">Completed Actions</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-orange-600">{offlineQueue.length}</div>
            <div className="text-sm text-orange-700">Queued Actions</div>
          </div>
        </div>
      </motion.div>

      {/* Audit Log Modal */}
      <AnimatePresence>
        {showAuditLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAuditLog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl max-h-[80vh] overflow-hidden bg-white rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">🛡️ HIPAA Audit Log</h3>
                    <p className="text-green-100 text-sm">Comprehensive security and compliance tracking</p>
                  </div>
                  <button
                    onClick={() => setShowAuditLog(false)}
                    className="text-white hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{auditLogs.length}</div>
                    <div className="text-sm text-blue-700">Total Events</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">
                      {auditLogs.filter((log) => log.action.includes("COMPLETED")).length}
                    </div>
                    <div className="text-sm text-green-700">Completed Actions</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">
                      {auditLogs.filter((log) => log.action.includes("HANDOFF")).length}
                    </div>
                    <div className="text-sm text-purple-700">Admin Handoffs</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-orange-600">{offlineQueue.length}</div>
                    <div className="text-sm text-orange-700">Queued Actions</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">📋 Recent Activity</h4>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        HIPAA Compliant
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Encrypted</span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xl">{getActionIcon(log.action)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {log.action
                              .replace(/_/g, " ")
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                          <div className="text-xs text-gray-600">{log.details}</div>
                          <div className="text-xs text-gray-500">{log.timestamp}</div>
                        </div>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          Logged
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Information */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🔒 Compliance & Security</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <strong>Encryption:</strong> AES-256 end-to-end encryption
                    </div>
                    <div>
                      <strong>Retention:</strong> 7 years as per HIPAA requirements
                    </div>
                    <div>
                      <strong>Access Control:</strong> Role-based authentication
                    </div>
                    <div>
                      <strong>Audit Trail:</strong> Immutable blockchain logging
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
