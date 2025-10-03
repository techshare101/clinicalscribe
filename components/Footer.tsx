"use client";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left side: brand + rights */}
        <div className="text-center md:text-left">
          <p className="font-medium text-white">ClinicalScribe</p>
          <p className="text-slate-400 text-sm">
            © 2025 All rights reserved. <br />
            Powered by <span className="text-purple-400">MetalMindTech</span>.
          </p>
        </div>

        {/* Middle: links */}
        <div className="flex flex-col md:flex-row gap-4 text-slate-400 text-sm text-center">
          <a href="/privacy" className="hover:text-white">Privacy Policy</a>
          <a href="/terms" className="hover:text-white">Terms of Service</a>
          <a href="/hipaa" className="hover:text-white">HIPAA Compliance</a>
        </div>

        {/* Right: trust + socials */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="flex items-center gap-2 bg-green-900/40 px-3 py-1 rounded-full text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            SSL Secure & Encrypted
          </div>
          <div className="flex gap-4 text-slate-400 text-xl">
            <a href="https://twitter.com" aria-label="Twitter">🐦</a>
            <a href="https://linkedin.com" aria-label="LinkedIn">💼</a>
            <a href="https://github.com" aria-label="GitHub">💻</a>
            <a href="https://youtube.com/@metalmindtech" aria-label="YouTube">▶️</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
