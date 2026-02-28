"use client";

import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";

interface WelcomeHeaderProps {
  className?: string;
}

export function WelcomeHeader({ className }: WelcomeHeaderProps) {
  const { profile, isLoading } = useProfile();
  
  // Get today's date in a nice format
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Determine greeting based on time of day
  const hours = new Date().getHours();
  let greeting = "Good evening";
  if (hours < 12) greeting = "Good morning";
  else if (hours < 18) greeting = "Good afternoon";

  // Display name preference: displayName → email → fallback
  const displayName = profile?.displayName || profile?.email?.split("@")[0] || "Clinician";

  // Determine badge based on role
  const isAdmin = profile?.role === "system-admin" || profile?.role === "nurse-admin";
  const roleDisplay = profile?.role === "system-admin" ? "System Admin" : profile?.role === "nurse-admin" ? "Nurse Admin" : "Nurse";

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl shadow-sm mb-6 ${className}`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800" />
      
      {/* Subtle decorative element */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      
      <div className="relative z-10 px-6 py-5 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              {greeting}, {displayName} 👋
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              Welcome to your ClinicalScribe dashboard
              {isAdmin && " — Admin access enabled"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              profile?.role === "system-admin" ? 'bg-white/20 text-white' : 
              profile?.role === "nurse-admin" ? 'bg-white/20 text-white' : 
              'bg-white/15 text-white/90'
            }`}>
              {roleDisplay}
            </span>
            
            {/* Date display */}
            <span className="text-sm text-white/60">
              {today}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
