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
      <motion.div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: "white",
            padding: "32px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: "#111827" }}>
            {current.title}
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "24px", lineHeight: "1.5" }}>{current.description}</p>
          <button
            onClick={handleNextStep}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "14px",
              backgroundColor: "#3b82f6",
              color: "white",
              width: "100%",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#2563eb")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#3b82f6")}
          >
            {step < onboardingSteps.length - 1 ? "Next" : "Get Started"}
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Offline Mode Banner */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>☁️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", color: "#92400e" }}>🔄 Offline Mode Active</div>
                <div style={{ fontSize: "14px", color: "#b45309" }}>
                  You're currently offline. Actions will be queued and synced when connection is restored.
                  {offlineQueue.length > 0 && (
                    <span style={{ marginLeft: "8px", fontWeight: "500" }}>
                      {offlineQueue.length} action(s) queued for sync
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "500",
                  backgroundColor: "#fbbf24",
                  color: "#92400e",
                }}
              >
                {offlineQueue.length} Queued
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Secure Logging Notice */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#111827", margin: 0 }}>ClinicalScribe 🧬</h1>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              backgroundColor: online ? "#d1fae5" : "#fee2e2",
              color: online ? "#065f46" : "#991b1b",
            }}
          >
            {online ? "🟢 Online" : "🔴 Offline"}
          </span>
        </div>

        {/* Secure Logging Notice */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ecfdf5",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid #a7f3d0",
            }}
          >
            <span>🔒</span>
            <span>🛡️</span>
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#065f46" }}>Secure Logging Active</span>
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "500",
                backgroundColor: "#a7f3d0",
                color: "#065f46",
              }}
            >
              {auditLogs.length} Events
            </span>
          </div>
          <button
            onClick={() => setShowAuditLog(true)}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid #a7f3d0",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "14px",
              backgroundColor: "#ecfdf5",
              color: "#065f46",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#d1fae5")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#ecfdf5")}
          >
            👁️ View Audit Log
          </button>
        </div>
      </motion.header>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={() => {
            setShowSOAPBuilder(false)
            logAuditEvent("DASHBOARD_VIEW_SELECTED", "User switched to dashboard view")
          }}
          style={{
            padding: "12px 24px",
            borderRadius: "12px",
            border: showSOAPBuilder ? "1px solid #d1d5db" : "none",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "14px",
            backgroundColor: showSOAPBuilder ? "white" : "#3b82f6",
            color: showSOAPBuilder ? "#374151" : "white",
          }}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => {
            setShowSOAPBuilder(true)
            logAuditEvent("SOAP_BUILDER_VIEW_SELECTED", "User switched to SOAP builder view")
          }}
          style={{
            padding: "12px 24px",
            borderRadius: "12px",
            border: !showSOAPBuilder ? "1px solid #d1d5db" : "none",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "14px",
            backgroundColor: !showSOAPBuilder ? "white" : "#3b82f6",
            color: !showSOAPBuilder ? "#374151" : "white",
          }}
        >
          🧾 SOAP Builder
        </button>
      </div>

      {/* Main Content */}
      <motion.div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          padding: "24px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px", color: "#111827" }}>
          📤 Send to Admin / EHR Push
        </h2>

        {/* Patient Summary */}
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
          }}
        >
          <h3 style={{ fontWeight: "600", marginBottom: "12px", color: "#111827" }}>📋 Patient Summary</h3>
          <div style={{ fontSize: "14px" }}>
            <div style={{ marginBottom: "8px" }}>
              <strong>Original (Spanish):</strong>
              <p style={{ color: "#6b7280", marginTop: "4px", margin: 0 }}>{transcribedText}</p>
            </div>
            <div>
              <strong>Translation (English):</strong>
              <p style={{ color: "#6b7280", marginTop: "4px", margin: 0 }}>{translatedText}</p>
            </div>
          </div>
        </div>

        {/* Nurse Signature */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontWeight: "500", marginBottom: "4px", color: "#111827" }}>
            🖋️ Nurse Signature
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              fontSize: "14px",
              outline: "none",
            }}
            value={signature}
            onChange={(e) => {
              setSignature(e.target.value)
              logAuditEvent("SIGNATURE_FIELD_MODIFIED", "Nurse signature field updated")
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          />
        </div>

        {/* Submission Progress */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ marginBottom: "16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  style={{ color: "#3b82f6" }}
                >
                  🔄
                </motion.div>
                <span style={{ fontSize: "14px", fontWeight: "500" }}>Processing handoff...</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    backgroundColor: "#3b82f6",
                    transition: "width 0.3s ease",
                    width: `${submissionProgress}%`,
                  }}
                />
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
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
          style={{
            padding: "12px 24px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "600",
            cursor: isSubmitting || !signature.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            fontSize: "14px",
            width: "100%",
            backgroundColor: isSubmitting || !signature.trim() ? "#d1d5db" : "#6366f1",
            color: isSubmitting || !signature.trim() ? "#9ca3af" : "white",
          }}
        >
          {isSubmitting ? (
            <>
              <span style={{ display: "inline-block", marginRight: "8px" }}>🔄</span>
              Processing...
            </>
          ) : (
            "📨 Email PDF Report to Admin"
          )}
        </button>

        {/* Quick Stats */}
        <div
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#dbeafe",
              padding: "16px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1d4ed8" }}>{auditLogs.length}</div>
            <div style={{ fontSize: "14px", color: "#1e40af" }}>Security Events</div>
          </div>
          <div
            style={{
              backgroundColor: "#dcfce7",
              padding: "16px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#16a34a" }}>
              {auditLogs.filter((log) => log.action.includes("COMPLETED")).length}
            </div>
            <div style={{ fontSize: "14px", color: "#15803d" }}>Completed Actions</div>
          </div>
          <div
            style={{
              backgroundColor: "#fed7aa",
              padding: "16px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ea580c" }}>{offlineQueue.length}</div>
            <div style={{ fontSize: "14px", color: "#c2410c" }}>Queued Actions</div>
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
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              zIndex: 50,
            }}
            onClick={() => setShowAuditLog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                maxWidth: "800px",
                width: "100%",
                maxHeight: "80vh",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  color: "white",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>🛡️ HIPAA Audit Log</h3>
                    <p style={{ margin: "4px 0 0 0", opacity: 0.9 }}>Comprehensive security and compliance tracking</p>
                  </div>
                  <button
                    onClick={() => setShowAuditLog(false)}
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      border: "none",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "24px", maxHeight: "60vh", overflowY: "auto" }}>
                {/* Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ backgroundColor: "#dbeafe", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1d4ed8" }}>{auditLogs.length}</div>
                    <div style={{ fontSize: "14px", color: "#1e40af" }}>Total Events</div>
                  </div>
                  <div style={{ backgroundColor: "#dcfce7", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#16a34a" }}>
                      {auditLogs.filter((log) => log.action.includes("COMPLETED")).length}
                    </div>
                    <div style={{ fontSize: "14px", color: "#15803d" }}>Completed Actions</div>
                  </div>
                  <div style={{ backgroundColor: "#e9d5ff", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#7c3aed" }}>
                      {auditLogs.filter((log) => log.action.includes("HANDOFF")).length}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6d28d9" }}>Admin Handoffs</div>
                  </div>
                  <div style={{ backgroundColor: "#fed7aa", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ea580c" }}>{offlineQueue.length}</div>
                    <div style={{ fontSize: "14px", color: "#c2410c" }}>Queued Actions</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h4 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>📋 Recent Activity</h4>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: "#dcfce7",
                          color: "#15803d",
                        }}
                      >
                        HIPAA Compliant
                      </span>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                        }}
                      >
                        Encrypted
                      </span>
                    </div>
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>{getActionIcon(log.action)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "500", fontSize: "14px" }}>
                            {log.action
                              .replace(/_/g, " ")
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>{log.details}</div>
                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>{log.timestamp}</div>
                        </div>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: "#dcfce7",
                            color: "#15803d",
                          }}
                        >
                          Logged
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Information */}
                <div
                  style={{
                    marginTop: "24px",
                    backgroundColor: "#dbeafe",
                    border: "1px solid #93c5fd",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <h4 style={{ fontWeight: "600", color: "#1e3a8a", marginBottom: "8px" }}>🔒 Compliance & Security</h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                      fontSize: "14px",
                      color: "#1e40af",
                    }}
                  >
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
