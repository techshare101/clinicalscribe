'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function ActiveSessionsCounter() {
  const { user, loading: authLoading } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }
        
        const token = await user.getIdToken();
        
        // Fetch active sessions count from the API route
        const res = await fetch("/api/active-sessions", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch active sessions");
        }
        
        const data = await res.json();
        setCount(data.count);
      } catch (error) {
        console.error('Error fetching active sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // ✅ Critical Guard: only fetch after auth resolves
    if (!authLoading && user) {
      fetchActiveSessions();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5, type: "spring", bounce: 0.4 }}
        className="group relative overflow-hidden"
      >
        <div className="relative rounded-3xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 backdrop-blur-xl bg-opacity-90 p-8 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 text-white border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm ring-1 ring-white/30">
              <span className="text-3xl drop-shadow-lg">🟢</span>
            </div>
            <div className="relative">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
              <div className="absolute inset-0 animate-ping rounded-full h-6 w-6 border border-white/20" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-white/95 text-sm font-bold uppercase tracking-wider drop-shadow-sm">Active Recordings</h3>
            <div className="text-4xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-lg">
              <span className="bg-white/20 rounded-lg px-4 py-2 animate-pulse">---</span>
            </div>
            <p className="text-white/90 text-sm font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Loading...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5, type: "spring", bounce: 0.4 }}
        className="group relative overflow-hidden"
      >
        <div className="relative rounded-3xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 backdrop-blur-xl bg-opacity-90 p-8 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 text-white border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm ring-1 ring-white/30">
              <span className="text-3xl drop-shadow-lg">🟢</span>
            </div>
            <div className="flex items-center text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-1" />
              Login Required
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-white/95 text-sm font-bold uppercase tracking-wider drop-shadow-sm">Active Recordings</h3>
            <div className="text-4xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-lg">
              <span className="tabular-nums">0</span>
            </div>
            <p className="text-white/90 text-sm font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Please log in
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.5, type: "spring", bounce: 0.4 }}
      className="group relative overflow-hidden"
    >
      {/* Glass Morphism Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 backdrop-blur-xl bg-opacity-90 p-8 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 text-white border border-white/10">
        {/* Sparkle Animation */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="h-4 w-4 text-white/60 animate-pulse" />
        </div>
        
        {/* Top Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm ring-1 ring-white/30">
            <span className="text-3xl drop-shadow-lg">🟢</span>
          </div>
          {loading ? (
            <div className="relative">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
              <div className="absolute inset-0 animate-ping rounded-full h-6 w-6 border border-white/20" />
            </div>
          ) : (
            <div className="flex items-center text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-1" />
              Live
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-white/95 text-sm font-bold uppercase tracking-wider drop-shadow-sm">Active Recordings</h3>
          <motion.p 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-4xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-lg"
          >
            {loading ? (
              <span className="bg-white/20 rounded-lg px-4 py-2 animate-pulse">---</span>
            ) : (
              <span className="tabular-nums">{count.toLocaleString()}</span>
            )}
          </motion.p>
          <p className="text-white/90 text-sm font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {count === 1 ? 'Session in progress' : 'Sessions in progress'}
          </p>
        </div>
        
        {/* Bottom Glow Effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
}