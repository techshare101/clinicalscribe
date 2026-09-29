"use client";

import { Twitter, Linkedin, Github, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-10 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left side: brand + rights */}
        <div className="text-center md:text-left">
          <p className="font-semibold text-white tracking-wide">ClinicalScribe</p>
          <p className="text-slate-400 text-sm mt-1">
            © 2025 All rights reserved. <br />
            Powered by{' '}
            <span className="text-purple-400 font-medium">MetalMindTech</span>.
          </p>
        </div>

        {/* Middle: links */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-slate-400 text-sm text-center">
          <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="/privacy" className="hover:text-white transition-colors">Data Security</a>
        </div>

        {/* Right: trust + socials */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/40 px-3.5 py-1 rounded-full text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            256-bit SSL Encrypted
          </div>
          <div className="flex gap-4 text-slate-400">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
