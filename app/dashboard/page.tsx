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

// Empty state component with color support
function EmptyState({ icon: Icon, title, description, color = "gray" }: { icon: any; title: string; description: string; color?: string }) {
  const colorMap: Record<string, { bg: string; iconBg: string; icon: string; title: string; desc: string; ring: string }> = {
    emerald: { bg: "bg-emerald-50/60 dark:bg-emerald-950/30", iconBg: "bg-emerald-100 dark:bg-emerald-900/50", icon: "text-emerald-500 dark:text-emerald-400", title: "text-emerald-800 dark:text-emerald-200", desc: "text-emerald-600/70 dark:text-emerald-400/70", ring: "ring-1 ring-emerald-200/50 dark:ring-emerald-700/40" },
    blue:    { bg: "bg-blue-50/60 dark:bg-blue-950/30",       iconBg: "bg-blue-100 dark:bg-blue-900/50",    icon: "text-blue-500 dark:text-blue-400",    title: "text-blue-800 dark:text-blue-200",    desc: "text-blue-600/70 dark:text-blue-400/70",    ring: "ring-1 ring-blue-200/50 dark:ring-blue-700/40" },
    indigo:  { bg: "bg-indigo-50/60 dark:bg-indigo-950/30",   iconBg: "bg-indigo-100 dark:bg-indigo-900/50",  icon: "text-indigo-500 dark:text-indigo-400",  title: "text-indigo-800 dark:text-indigo-200",  desc: "text-indigo-600/70 dark:text-indigo-400/70",  ring: "ring-1 ring-indigo-200/50 dark:ring-indigo-700/40" },
    amber:   { bg: "bg-amber-50/60 dark:bg-amber-950/30",     iconBg: "bg-amber-100 dark:bg-amber-900/50",   icon: "text-amber-500 dark:text-amber-400",   title: "text-amber-800 dark:text-amber-200",   desc: "text-amber-600/70 dark:text-amber-400/70",   ring: "ring-1 ring-amber-200/50 dark:ring-amber-700/40" },
    gray:    { bg: "bg-gray-50 dark:bg-gray-800/30",           iconBg: "bg-gray-100 dark:bg-gray-800",        icon: "text-gray-400 dark:text-gray-500",    title: "text-gray-500 dark:text-gray-300",    desc: "text-gray-400 dark:text-gray-500",           ring: "" },
  }
  const c = colorMap[color] || colorMap.gray
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center rounded-xl ${c.bg} ${c.ring}`}>
      <div className={`p-3.5 ${c.iconBg} rounded-2xl mb-3 shadow-sm`}>
        <Icon className={`h-6 w-6 ${c.icon}`} />
      </div>
      <p className={`text-sm font-semibold ${c.title}`}>{title}</p>
      <p className={`text-xs mt-1 max-w-[200px] ${c.desc}`}>{description}</p>
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
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
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
          accent="bg-gradient-to-r from-emerald-400 to-emerald-600"
          badge={{ text: "Live", color: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" }}
        >
          {patients.length === 0 ? (
            <EmptyState icon={UserCheck} title="No active patients" description="Patients will appear here during encounters" color="emerald" />
          ) : (
            <div className="space-y-2.5">
              {patients.map((patient, index) => (
                <motion.div 
                  key={patient.id} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{patient.name}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        patient.priority === "High" ? "bg-red-100 text-red-700" 
                        : patient.priority === "Medium" ? "bg-amber-100 text-amber-700" 
                        : "bg-gray-100 text-gray-600"
                      }`}>
                        {patient.priority}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                      <span>{patient.room}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
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
          accent="bg-gradient-to-r from-blue-400 to-blue-600"
          badge={{ text: "Feed", color: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" }}
        >
          <div className="space-y-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setViewMode("summary")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "summary" ? "bg-blue-600 text-white shadow-sm" : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setViewMode("soap")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "soap" ? "bg-blue-600 text-white shadow-sm" : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                }`}
              >
                SOAP
              </button>
            </div>
            
            {transcriptions.length === 0 ? (
              <EmptyState icon={FileText} title="No notes yet" description="Notes will appear as you create them" color="blue" />
            ) : (
              <div className="space-y-2.5">
                {transcriptions
                  .filter(item => {
                    if (viewMode === "summary") return item.type === "Summary"
                    if (viewMode === "soap") return item.type === "SOAP"
                    return true
                  })
                  .slice(0, 4)
                  .map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{item.patient}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
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
          accent="bg-gradient-to-r from-indigo-400 to-indigo-600"
          badge={{ text: "Analytics", color: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" }}
        >
          {analytics.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No data yet" description="Analytics will populate as you use the system" color="indigo" />
          ) : (
            <div className="space-y-4">
              {analytics.map((metric, index) => {
                const pct = Math.min((metric.value / metric.target) * 100, 100)
                const isGood = pct >= 80
                return (
                  <div key={metric.id}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.metric}</span>
                      <span className="text-sm tabular-nums">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{metric.value}</span>
                        <span className="text-gray-400">/{metric.target}</span>
                        <span className="text-gray-400 text-xs ml-0.5">{metric.unit === "%" ? "%" : ""}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
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
          accent="bg-gradient-to-r from-amber-400 to-amber-600"
          badge={{ text: "Audit", color: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" }}
        >
          <div className="space-y-3">
            <div className="flex gap-1.5">
              {["all", "summary", "soap"].map((f) => (
                <button
                  key={f}
                  onClick={() => setAuditFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    auditFilter === f ? "bg-amber-600 text-white shadow-sm" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                  }`}
                >
                  {f === "all" && <Filter className="w-3 h-3 inline mr-1" />}
                  {f}
                </button>
              ))}
            </div>
            
            {auditLogs.length === 0 ? (
              <EmptyState icon={Shield} title="No activity" description="Actions will be logged here" color="amber" />
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log, index) => (
                  <motion.div 
                    key={log.id} 
                    className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
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
          { label: "Notes to Review", count: 3, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/40" },
          { label: "Flagged", count: 1, icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/40" },
          { label: "Ready to Export", count: 5, icon: FileSpreadsheet, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/40" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.label}
              className="flex items-center gap-3.5 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stat.count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PaywallCard />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <WelcomeHeader />
        <DashboardDataProvider>
          <DashboardContent />
        </DashboardDataProvider>
      </div>
    </div>
  )
}
