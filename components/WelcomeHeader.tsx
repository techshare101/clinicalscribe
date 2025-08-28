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
  const isAdmin = profile?.role === "admin";
  const role = isAdmin ? "Admin" : "Clinician";

  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl shadow-lg mb-8 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800"></div>
      
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
      
      <div className="relative z-10 px-8 py-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold mb-1">
              {greeting}, {displayName} 👋
            </h1>
            <p className="text-white/80">
              Welcome to your ClinicalScribe dashboard
              {isAdmin && " — Admin access enabled"}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
            {/* Role badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isAdmin ? 'bg-purple-500 text-white' : 'bg-blue-200 text-blue-800'}`}>
              {role}
            </span>
            
            {/* Date display */}
            <span className="text-sm opacity-80">
              {today}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
