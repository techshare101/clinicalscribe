"use client"

import { useProfile } from "@/hooks/useProfile"
import PaywallCard from "@/components/PaywallCard"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle, 
  AlertCircle, 
  FileSpreadsheet, 
  Filter,
  Clock,
  UserCheck,
  BarChart3,
  Shield,
  Mic,
  FileText,
  Play,
  Plus,
  ArrowRight,
  Activity,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardCard } from "@/components/DashboardCard"
import { WelcomeHeader } from "@/components/WelcomeHeader"
import { DashboardDataProvider, useDashboardData } from "@/components/DashboardDataProvider"
import Link from "next/link"
import { useRouter } from "next/navigation"

function useHydration() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  return hydrated
}

// Empty state component
function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 bg-gray-100 rounded-xl mb-3">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  )
}

function DashboardContent() {
  const { patients, transcriptions, analytics, auditLogs, loading, mode } = useDashboardData()
  const [viewMode, setViewMode] = useState<"summary" | "soap">("summary")
  const [auditFilter, setAuditFilter] = useState<string>("all")

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-indigo-600" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sample Data Indicator */}
      {mode === "demo" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm text-amber-800 font-medium">Sample data</span>
          <span className="text-sm text-amber-600">— Real patient data will appear here as you use ClinicalScribe.</span>
        </div>
      )}

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voice Recording */}
        <Link href="/transcription" className="group">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Voice Recording</h3>
                  <p className="text-white/70 text-sm">Start a new patient encounter</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 rounded-lg text-sm font-medium shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Record
                </div>
                <ArrowRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Manual SOAP */}
        <Link href="/soap-entry" className="group">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">SOAP Note</h3>
                  <p className="text-white/70 text-sm">Create a manual clinical note</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium">
                  <Plus className="h-4 w-4" />
                  New
                </div>
                <ArrowRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patient Queue */}
        <DashboardCard 
          title="Patient Queue" 
          description="Active encounters"
          badge={{ text: "Live", color: "bg-emerald-100 text-emerald-700" }}
        >
          {patients.length === 0 ? (
            <EmptyState icon={UserCheck} title="No active patients" description="Patients will appear here during encounters" />
          ) : (
            <div className="space-y-2.5">
              {patients.map((patient, index) => (
                <motion.div 
                  key={patient.id} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all duration-200"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm truncate">{patient.name}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        patient.priority === "High" ? "bg-red-100 text-red-700" 
                        : patient.priority === "Medium" ? "bg-amber-100 text-amber-700" 
                        : "bg-gray-100 text-gray-600"
                      }`}>
                        {patient.priority}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <span>{patient.room}</span>
                      <span className="text-gray-300">·</span>
                      <span>{patient.formattedTime}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${
                    patient.status === "Signed" ? "bg-emerald-100 text-emerald-700" 
                    : patient.status === "SOAP Ready" ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    {patient.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </DashboardCard>

        {/* Transcription Feed */}
        <DashboardCard 
          title="Recent Notes" 
          description="Latest transcriptions"
          badge={{ text: "Feed", color: "bg-blue-100 text-blue-700" }}
        >
          <div className="space-y-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setViewMode("summary")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "summary" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setViewMode("soap")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "soap" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                SOAP
              </button>
            </div>
            
            {transcriptions.length === 0 ? (
              <EmptyState icon={FileText} title="No notes yet" description="Notes will appear as you create them" />
            ) : (
              <div className="space-y-2.5">
                {transcriptions
                  .filter(item => viewMode === "summary" ? item.type === "Summary" : item.type === "SOAP")
                  .slice(0, 4)
                  .map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all duration-200"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{item.patient}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 shrink-0">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.formattedTime}
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Analytics */}
        <DashboardCard 
          title="Performance" 
          description="Key metrics"
          badge={{ text: "Analytics", color: "bg-indigo-100 text-indigo-700" }}
        >
          {analytics.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No data yet" description="Analytics will populate as you use the system" />
          ) : (
            <div className="space-y-4">
              {analytics.map((metric, index) => {
                const pct = Math.min((metric.value / metric.target) * 100, 100)
                const isGood = pct >= 80
                return (
                  <div key={metric.id}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                      <span className="text-sm tabular-nums">
                        <span className="font-semibold text-gray-900">{metric.value}</span>
                        <span className="text-gray-400">/{metric.target}</span>
                        <span className="text-gray-400 text-xs ml-0.5">{metric.unit === "%" ? "%" : ""}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <motion.div 
                        className={`h-2 rounded-full ${isGood ? "bg-emerald-500" : "bg-indigo-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DashboardCard>

        {/* Audit Trail */}
        <DashboardCard 
          title="Activity Log" 
          description="Recent actions"
          badge={{ text: "Audit", color: "bg-amber-100 text-amber-700" }}
        >
          <div className="space-y-3">
            <div className="flex gap-1.5">
              {["all", "summary", "soap"].map((f) => (
                <button
                  key={f}
                  onClick={() => setAuditFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    auditFilter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" && <Filter className="w-3 h-3 inline mr-1" />}
                  {f}
                </button>
              ))}
            </div>
            
            {auditLogs.length === 0 ? (
              <EmptyState icon={Shield} title="No activity" description="Actions will be logged here" />
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log, index) => (
                  <motion.div 
                    key={log.id} 
                    className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all duration-200"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{log.user}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{log.action} · {log.patient}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {log.formattedTime}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Quick Stats Bar */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {[
          { label: "Notes to Review", count: 3, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Flagged", count: 1, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Ready to Export", count: 5, icon: FileSpreadsheet, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.label}
              className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">{stat.count}</div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

export default function DashboardPage() {
  const hydrated = useHydration()
  const { profile, isLoading } = useProfile()
  const router = useRouter()

  const devOverride = process.env.NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS === "true"

  if (!hydrated || isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-indigo-600" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (!devOverride && profile && !profile.betaActive) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PaywallCard />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <WelcomeHeader />
        <DashboardDataProvider>
          <DashboardContent />
        </DashboardDataProvider>
      </div>
    </div>
  )
}
