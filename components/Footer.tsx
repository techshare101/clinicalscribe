"use client";

import { useState } from "react";
import { Lock, Twitter, Linkedin, Github, Youtube } from "lucide-react";

export default function Footer() {
  const [modal, setModal] = useState<"privacy" | "terms" | null>(null);

  return (
    <footer className="bg-gradient-to-r from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl border-t border-gray-700/50 text-gray-300 py-12 px-6 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        
        {/* Left: Brand / Rights */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">ClinicalScribe</h3>
          <p className="text-lg leading-relaxed">
            © 2025 All rights reserved. <br />
            Powered by <span className="font-bold text-purple-400">MetalMindTech</span>.
          </p>
        </div>

        {/* Middle: Links */}
        <div className="space-y-3">
          <button
            onClick={() => setModal("privacy")}
            className="hover:text-white transition text-lg font-medium block py-2 px-4 rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setModal("terms")}
            className="hover:text-white transition text-lg font-medium block py-2 px-4 rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            Terms of Service
          </button>
        </div>

        {/* Right: Trust + Social */}
        <div className="flex flex-col items-start md:items-end space-y-4">
          <div className="flex items-center gap-3 text-green-400 bg-green-900/30 px-4 py-2 rounded-full backdrop-blur-sm border border-green-700/50">
            <Lock size={20} className="flex-shrink-0" />
            <span className="text-lg font-medium">SSL Secure & Encrypted</span>
          </div>
          <div className="flex gap-5 mt-2">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="group">
              <Twitter size={28} className="hover:text-white transition-all duration-300 group-hover:scale-110 group-hover:text-blue-400" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="group">
              <Linkedin size={28} className="hover:text-white transition-all duration-300 group-hover:scale-110 group-hover:text-blue-500" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="group">
              <Github size={28} className="hover:text-white transition-all duration-300 group-hover:scale-110 group-hover:text-gray-300" />
            </a>
            <a href="https://youtube.com/@metalmindtech" target="_blank" rel="noopener noreferrer" className="group">
              <Youtube size={28} className="hover:text-white transition-all duration-300 group-hover:scale-110 group-hover:text-red-500" />
            </a>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 max-w-lg w-full p-8 text-gray-100">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {modal === "privacy" ? "Privacy Policy" : "Terms of Service"}
            </h2>
            <div className="text-lg space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50 rounded-lg">
              {modal === "privacy" ? (
                <>
                  <p className="leading-relaxed">
                    We value your privacy. Your data is encrypted and handled securely. 
                    ClinicalScribe does not sell personal data. 
                  </p>
                  <p className="leading-relaxed">
                    Some features rely on AI transcription and analysis. 
                    AI output may not always be 100% accurate — always review before using in official records. 
                  </p>
                </>
              ) : (
                <>
                  <p className="leading-relaxed">
                    By using ClinicalScribe Beta, you agree this is an experimental service. 
                    We make no guarantees of accuracy or fitness for a particular medical purpose. 
                  </p>
                  <p className="leading-relaxed">
                    AI outputs must be reviewed by qualified staff before inclusion in patient charts. 
                    We disclaim liability for errors arising from unverified AI suggestions. 
                  </p>
                </>
              )}
            </div>
            <div className="mt-8 text-right">
              <button
                onClick={() => setModal(null)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}