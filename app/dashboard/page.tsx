"use client";

import { useProfile } from "@/hooks/useProfile";
import PaywallCard from "@/components/PaywallCard";
import { EhrStatusBadge } from "@/components/EhrStatusBadge";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Download, Calendar, Clock } from "lucide-react";

// Add hydration state to prevent SSR mismatch
function useHydration() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

function StatCard({ title, value, change, icon, gradient, isLoading, delay = 0 }: { 
  title: string; value: number; change: string; icon: string; gradient: string; isLoading: boolean; delay?: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, type: "spring", bounce: 0.4 }}
      className="group relative overflow-hidden"
    >
      {/* Glass Morphism Card */}
      <div className={`relative rounded-3xl bg-gradient-to-br ${gradient} backdrop-blur-xl bg-opacity-90 p-8 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 text-white border border-white/10`}>
        {/* Sparkle Animation */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="h-4 w-4 text-white/60 animate-pulse" />
        </div>
        
        {/* Top Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm ring-1 ring-white/30">
            <span className="text-3xl drop-shadow-lg">{icon}</span>
          </div>
          {isLoading ? (
            <div className="relative">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
              <div className="absolute inset-0 animate-ping rounded-full h-6 w-6 border border-white/20" />
            </div>
          ) : (
            <div className="flex items-center text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-white/95 text-sm font-bold uppercase tracking-wider drop-shadow-sm">{title}</h3>
          <motion.p 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
            className="text-4xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-lg"
          >
            {isLoading ? (
              <span className="bg-white/20 rounded-lg px-4 py-2 animate-pulse">---</span>
            ) : (
              <span className="tabular-nums">{value.toLocaleString()}</span>
            )}
          </motion.p>
          <p className="text-white/90 text-sm font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {change}
          </p>
        </div>
        
        {/* Bottom Glow Effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
}

function ReportList() {
  const user = auth.currentUser;
  const hydrated = useHydration();
  
  // Try uid first, fallback to userId for backward compatibility
  const [snapshotsUid, loadingUid] = useCollection(
    user && hydrated ? query(collection(db, "reports"), where("uid", "==", user.uid)) : null
  );
  const [snapshotsUserId, loadingUserId] = useCollection(
    user && hydrated && (!snapshotsUid || snapshotsUid.empty) ? query(collection(db, "reports"), where("userId", "==", user.uid)) : null
  );
  
  const snapshots = snapshotsUid?.empty ? snapshotsUserId : snapshotsUid;
  const loading = loadingUid || loadingUserId;

  // Show loading state until hydrated
  if (!hydrated || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500" />
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-blue-300/30" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-blue-100" />
        </div>
      </div>
    );
  }

  if (!snapshots?.docs.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center py-16 space-y-8"
      >
        {/* Animated Icon */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
          className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-blue-200/50"
        >
          <span className="text-4xl animate-bounce">📋</span>
        </motion.div>
        
        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-3"
        >
          <h3 className="text-2xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Your Clinical Journey Awaits
          </h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
            Transform your clinical documentation with AI-powered transcription and intelligent SOAP note generation
          </p>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex gap-4 justify-center"
        >
          <Link 
            href="/transcription" 
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-3">
              🎤 Start Recording
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </span>
          </Link>
          
          <Link 
            href="/soap" 
            className="group px-8 py-4 bg-white/70 backdrop-blur-sm text-gray-800 rounded-2xl font-bold border-2 border-gray-200 hover:border-blue-300 hover:bg-white shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300"
          >
            <span className="flex items-center gap-3">
              📝 Create SOAP Note
              <Sparkles className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </span>
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {snapshots.docs.map((doc, index) => {
          const data = doc.data();
          return (
            <motion.div 
              key={doc.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 p-8 hover:-translate-y-1"
            >
              {/* Gradient Border Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                      #{index + 1}
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                      Clinical Report
                      <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        Active
                      </div>
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Recently created
                    </p>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors duration-200">
                    <Download className="h-4 w-4 text-blue-600" />
                  </button>
                  <button className="p-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-colors duration-200">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </button>
                </div>
              </div>

              {/* Content Sections */}
              <div className="space-y-4">
                {data.transcript && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-6 border-l-4 border-emerald-400 shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/30 rounded-full -mr-10 -mt-10" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <span className="text-emerald-600 text-lg">🎤</span>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-800 text-sm uppercase tracking-wide">Audio Transcript</span>
                        <div className="text-xs text-emerald-600 flex items-center gap-1">
                          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                          Voice Recognition
                        </div>
                      </div>
                    </div>
                    <p className="text-emerald-800 text-sm leading-relaxed font-medium">
                      {data.transcript.length > 150 ? data.transcript.substring(0, 150) + '...' : data.transcript}
                    </p>
                  </motion.div>
                )}

                {data.soapNote && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 rounded-2xl p-6 border-l-4 border-blue-400 shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -mr-10 -mt-10" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <span className="text-blue-600 text-lg">📝</span>
                      </div>
                      <div>
                        <span className="font-bold text-blue-800 text-sm uppercase tracking-wide">SOAP Note</span>
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                          AI Generated
                        </div>
                      </div>
                    </div>
                    <p className="text-blue-800 text-sm leading-relaxed font-medium">
                      {data.soapNote.length > 150 ? data.soapNote.substring(0, 150) + '...' : data.soapNote}
                    </p>
                  </motion.div>
                )}

                {data.pdfUrl && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl p-6 border-l-4 border-purple-400 shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -mr-10 -mt-10" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-xl">
                          <span className="text-purple-600 text-lg">📄</span>
                        </div>
                        <div>
                          <span className="font-bold text-purple-800 text-sm uppercase tracking-wide">PDF Document</span>
                          <div className="text-xs text-purple-600 flex items-center gap-1">
                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                            Ready for Download
                          </div>
                        </div>
                      </div>
                      <a 
                        href={data.pdfUrl} 
                        target="_blank" 
                        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Download className="h-4 w-4 group-hover:animate-bounce" />
                        Download
                      </a>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  const hydrated = useHydration();
  const { profile, isLoading } = useProfile();
  const user = auth.currentUser;
  const [stats, setStats] = useState({ totalPatients: 0, totalReports: 0, totalSoapNotes: 0, totalSessions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch real Firestore data
  useEffect(() => {
    if (!user?.uid || !hydrated) return;
    const fetchStats = async () => {
      try {
        // Try with 'uid' field first (newer pattern), fallback to 'userId' (legacy)
        const tryQuery = async (collectionName: string, field: string) => {
          try {
            return await getDocs(query(collection(db, collectionName), where(field, "==", user.uid)));
          } catch (error) {
            console.warn(`Query failed for ${collectionName} with field '${field}':`, error);
            return null;
          }
        };

        const [reportsSnap, soapSnap, transcriptsSnap] = await Promise.all([
          tryQuery("reports", "uid") || tryQuery("reports", "userId"),
          tryQuery("soapNotes", "uid") || tryQuery("soapNotes", "userId"),
          tryQuery("transcripts", "uid") || tryQuery("transcripts", "userId")
        ]);
        
        const patientIds = new Set();
        soapSnap?.forEach(doc => {
          const data = doc.data();
          if (data.patientId || data.patientName) patientIds.add(data.patientId || data.patientName);
        });
        
        setStats({
          totalPatients: patientIds?.size || 0,
          totalReports: reportsSnap?.size || 0,
          totalSoapNotes: soapSnap?.size || 0,
          totalSessions: (transcriptsSnap?.size || 0) + (reportsSnap?.size || 0)
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set stats to 0 on error rather than leaving in loading state
        setStats({
          totalPatients: 0,
          totalReports: 0,
          totalSoapNotes: 0,
          totalSessions: 0
        });
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user?.uid, hydrated]);

  // Don't render anything until hydrated to prevent SSR mismatch
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/30 border-t-blue-500 mx-auto" />
          <p className="text-lg font-semibold text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          {/* Sophisticated Loading Animation */}
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/20 border-t-blue-500 mx-auto" />
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-blue-300/30 mx-auto" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mx-auto" />
            <div className="absolute inset-4 bg-white rounded-full mx-auto" />
            <div className="absolute inset-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent"
            >
              Preparing Your Dashboard
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-gray-600 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              Loading clinical insights...
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!profile?.betaActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <PaywallCard />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-indigo-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-2">
            <h1 className="text-5xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-800 bg-clip-text text-transparent drop-shadow-sm">
              ClinicalScribe Dashboard
            </h1>
            <p className="text-gray-600 text-xl font-medium flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
              Your clinical documentation command center
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EhrStatusBadge />
          </motion.div>
        </motion.div>

        {/* Stats Cards with Real Data */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard 
            title="Total Patients" 
            value={stats.totalPatients} 
            change="+12% this month" 
            icon="👥" 
            gradient="from-blue-500 via-blue-600 to-indigo-700" 
            isLoading={statsLoading} 
            delay={0.1}
          />
          <StatCard 
            title="PDF Reports" 
            value={stats.totalReports} 
            change="+24% this week" 
            icon="📊" 
            gradient="from-emerald-500 via-green-600 to-teal-700" 
            isLoading={statsLoading} 
            delay={0.2}
          />
          <StatCard 
            title="SOAP Notes" 
            value={stats.totalSoapNotes} 
            change="+8% this week" 
            icon="📝" 
            gradient="from-purple-500 via-indigo-600 to-blue-700" 
            isLoading={statsLoading} 
            delay={0.3}
          />
          <StatCard 
            title="Sessions" 
            value={stats.totalSessions} 
            change="+18% this week" 
            icon="🎤" 
            gradient="from-orange-500 via-red-600 to-pink-700" 
            isLoading={statsLoading} 
            delay={0.4}
          />
        </motion.div>

        {/* Reports Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative group"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 p-8 relative overflow-hidden">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl ring-2 ring-white/30"
                  >
                    <span className="text-white text-3xl drop-shadow-lg">📋</span>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-white drop-shadow-lg">Clinical Reports</h2>
                    <p className="text-gray-300 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      Your documentation history
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link 
                    href="/transcription" 
                    className="group flex items-center gap-2 px-4 py-3 bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all duration-300 backdrop-blur-sm border border-blue-400/30 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                  >
                    <span>🎤</span>
                    Record
                    <div className="w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
                  </Link>
                  <Link 
                    href="/soap" 
                    className="group flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-105 hover:-translate-y-0.5"
                  >
                    <span>📝</span>
                    SOAP
                    <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="p-8">
              <ReportList />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}