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
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardCard } from "@/components/DashboardCard"
import { WelcomeHeader } from "@/components/WelcomeHeader"
import { DashboardDataProvider, useDashboardData } from "@/components/DashboardDataProvider"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

// Add hydration state to prevent SSR mismatch
function useHydration() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}

// Mock data for Admin Actions (not in Firestore)
const mockAdminActions = [
  { id: 1, action: "Approve Note", count: 3, icon: CheckCircle, color: "text-green-500" },
  { id: 2, action: "Flag for Review", count: 1, icon: AlertCircle, color: "text-yellow-500" },
  { id: 3, action: "Export to PDF", count: 5, icon: FileSpreadsheet, color: "text-blue-500" },
]

// Dashboard content component that uses the dashboard data context
function DashboardContent() {
  const { patients, transcriptions, analytics, auditLogs, loading, error, mode } = useDashboardData();
  const [viewMode, setViewMode] = useState<"summary" | "soap">("summary")
  const [filter, setFilter] = useState<string>("all")

  // Show loading state if data is loading
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500" />
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-blue-300/30" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-blue-100" />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Demo Mode Badge */}
      {mode === "demo" && (
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Demo Mode
          </span>
          <p className="mt-1 text-sm text-gray-600">
            Showing sample data. Real patient data will appear here when available.
          </p>
        </div>
      )}

      {/* Quick Launch Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Quick Transcription Launch */}
        <DashboardCard 
          title="Quick Transcription" 
          description="Start a new voice recording session"
          badge={{ text: "🎙️ RECORD", variant: "destructive" }}
          className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-0 shadow-2xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjMiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] opacity-20"></div>
          <div className="flex flex-col items-center justify-center p-6 relative z-10">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-md animate-pulse"></div>
              <Link href="/transcription">
                <Button 
                  size="lg" 
                  className="relative h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group shadow-red-500/30"
                >
                  <Mic className="h-10 w-10 text-white group-hover:text-white/90 transition-colors duration-300" />
                </Button>
              </Link>
            </div>
            <p className="text-white/90 text-center mt-2 font-medium">
              Click to start recording a new patient encounter
            </p>
            <div className="mt-4 flex items-center text-white/80 text-sm">
              <Play className="h-4 w-4 mr-1 animate-pulse text-white" />
              <span>Ready to record</span>
            </div>
          </div>
        </DashboardCard>

        {/* Quick SOAP Note Launch */}
        <DashboardCard 
          title="Quick SOAP Note" 
          description="Create a manual SOAP note"
          badge={{ text: "📝 WRITE", variant: "default" }}
          className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white border-0 shadow-2xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjMiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] opacity-20"></div>
          <div className="flex flex-col items-center justify-center p-6 relative z-10">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-md animate-pulse"></div>
              <Link href="/soap-entry">
                <Button 
                  size="lg" 
                  className="relative h-24 w-24 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group shadow-green-500/30"
                >
                  <FileText className="h-10 w-10 text-white group-hover:text-white/90 transition-colors duration-300" />
                </Button>
              </Link>
            </div>
            <p className="text-white/90 text-center mt-2 font-medium">
              Click to create a new manual SOAP note
            </p>
            <div className="mt-4 flex items-center text-white/80 text-sm">
              <Plus className="h-4 w-4 mr-1 text-white" />
              <span>New note</span>
            </div>
          </div>
        </DashboardCard>
      </motion.div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Queue Overview */}
        <DashboardCard 
          title="Patient Queue Overview" 
          description="Real-time status tracking of patients"
          badge={{ text: "LIVE", variant: "default" }}
        >
          <div className="space-y-4">
            {patients.map((patient, index) => (
              <motion.div 
                key={patient.id} 
                className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/50 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{patient.name}</span>
                    <Badge 
                      variant={patient.priority === "High" ? "destructive" : patient.priority === "Medium" ? "default" : "secondary"}
                      className="text-xs px-2 py-1 rounded-full"
                    >
                      {patient.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center">
                    <UserCheck className="h-4 w-4 mr-1" />
                    {patient.room} • {patient.formattedTime}
                  </div>
                </div>
                <Badge 
                  variant={patient.status === "Signed" ? "default" : "secondary"}
                  className="text-xs px-2 py-1 rounded-full"
                >
                  {patient.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        </DashboardCard>

        {/* Summary Feed */}
        <DashboardCard 
          title="Summary Feed" 
          description="Last 5 transcriptions"
          badge={{ text: "REAL-TIME", variant: "default" }}
        >
          <div className="space-y-4">
            {/* Toggle Buttons */}
            <div className="flex gap-2">
              <Button 
                variant={viewMode === "summary" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("summary")}
                className="rounded-full px-4 transition-all duration-300"
              >
                Summary
              </Button>
              <Button 
                variant={viewMode === "soap" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("soap")}
                className="rounded-full px-4 transition-all duration-300"
              >
                SOAP
              </Button>
            </div>
            
            {/* Transcription List */}
            <div className="space-y-3">
              {transcriptions
                .filter(item => filter === "all" || item.type?.toLowerCase() === filter)
                .slice(0, 5)
                .map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    className="p-4 bg-white/50 rounded-xl border border-white/50 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-800 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          {item.patient}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.formattedTime}
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </DashboardCard>

        {/* Triage Analytics */}
        <DashboardCard 
          title="Triage Analytics" 
          description="Daily metrics and performance indicators"
          badge={{ text: "ANALYTICS", variant: "default" }}
        >
          <div className="space-y-4">
            {analytics.map((metric, index) => (
              <div key={metric.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-indigo-500" />
                    {metric.metric}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{metric.value}{metric.unit} / {metric.target}{metric.unit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${(metric.value / metric.target) * 100}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(metric.value / metric.target) * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Audit Trail */}
        <DashboardCard 
          title="Audit Trail" 
          description="Complete activity log"
          badge={{ text: "SECURE", variant: "default" }}
        >
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={filter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("all")}
                className="rounded-full px-4 transition-all duration-300"
              >
                <Filter className="w-4 h-4 mr-1" />
                All
              </Button>
              <Button 
                variant={filter === "summary" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("summary")}
                className="rounded-full px-4 transition-all duration-300"
              >
                Summary
              </Button>
              <Button 
                variant={filter === "soap" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("soap")}
                className="rounded-full px-4 transition-all duration-300"
              >
                SOAP
              </Button>
            </div>
            
            {/* Audit Log List */}
            <div className="space-y-3">
              {auditLogs.map((log, index) => (
                <motion.div 
                  key={log.id} 
                  className="p-4 bg-white/50 rounded-xl border border-white/50 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium text-gray-800 flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-amber-500" />
                        {log.user}
                      </div>
                      <div className="text-sm text-gray-600">{log.action} • {log.patient}</div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {log.formattedTime}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </DashboardCard>

        {/* Admin Actions */}
        <DashboardCard 
          title="Admin Actions" 
          description="Quick controls and oversight"
          className="md:col-span-2"
          badge={{ text: "ADMIN", variant: "destructive" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mockAdminActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.div 
                  key={action.id} 
                  className="flex items-center p-4 bg-white/50 rounded-xl border border-white/50 hover:bg-white/70 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color.replace('text-', 'from-').replace('-500', '-100')} to-white mr-4`}>
                    <Icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{action.action}</div>
                    <div className="text-2xl font-bold text-gray-900">{action.count}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </DashboardCard>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const hydrated = useHydration()
  const { profile, isLoading } = useProfile()
  const router = useRouter()

  // Dev override: always show dashboard
  const devOverride = process.env.NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS === "true"

  // Show loading state until hydrated
  if (!hydrated) {
    return (
      <div className="flex justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500" />
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-blue-300/30" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-blue-100" />
        </div>
      </div>
    )
  }

  // Show paywall if user doesn't have active subscription AND no dev override
  if (!devOverride && !isLoading && profile && !profile.betaActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PaywallCard />
        </div>
      </div>
    )
  }

  // Show full dashboard if admin OR has active plan OR dev override
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating background elements for glassmorphism effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-indigo-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        {/* Welcome Header */}
        <WelcomeHeader />
        
        {/* Dashboard Data Provider with Dashboard Content */}
        <DashboardDataProvider>
          <DashboardContent />
        </DashboardDataProvider>
      </div>
    </div>
  )
}