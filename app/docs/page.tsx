import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Mic, 
  FileText, 
  Download, 
  ShieldCheck, 
  Share2, 
  PenTool, 
  HelpCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation | ClinicalScribe',
  description: 'Complete user guide for ClinicalScribe ambient medical transcription, SOAP generation, and clinical PDF export.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb / Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1.5 transition-colors"
          >
            ← Back to Home
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            Beta Documentation
          </span>
        </div>

        {/* Hero */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800 mb-10">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            ClinicalScribe Documentation
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Everything you need to capture clinical encounters, generate structured SOAP notes, and export signed, audit-ready clinical documents.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#quick-start"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Quick Start
            </a>
            <a
              href="#soap-notes"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              SOAP Workflow
            </a>
            <a
              href="#pdf-export"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              PDF &amp; Signing
            </a>
            <a
              href="#ehr-filing"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              EHR Filing
            </a>
            <a
              href="#security"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Security
            </a>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-slate-800 dark:text-slate-200">
          
          {/* Quick Start */}
          <section id="quick-start" className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Mic className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Quick Start: Ambient Recording</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              ClinicalScribe listens to clinical encounters in real time so clinicians can focus directly on the patient without looking at a computer screen.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-slate-700 dark:text-slate-300 ml-2">
              <li>
                <strong>Start Recording:</strong> Navigate to the <em>Transcription</em> dashboard and select your microphone. Click <strong>Start Recording</strong>.
              </li>
              <li>
                <strong>Automatic Chunking:</strong> Long sessions are automatically split into 15-minute segments to avoid audio data loss or upload timeouts.
              </li>
              <li>
                <strong>Stop &amp; Review:</strong> Click <strong>Stop Recording</strong>. Your speech is transcribed into clean clinical text with phonetic normalization for medical terms.
              </li>
              <li>
                <strong>Generate SOAP:</strong> Click <strong>Generate SOAP Note</strong> to produce structured Subjective, Objective, Assessment, and Plan documentation in seconds.
              </li>
            </ol>
          </section>

          {/* SOAP Workflow */}
          <section id="soap-notes" className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. SOAP Documentation Workflow</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Notes adhere to the clinical standard SOAP architecture:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Subjective (S)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Chief complaint, history of present illness (HPI), patient-reported symptoms, and medical history.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">Objective (O)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Vital signs, physical examination findings, lab/imaging results, and measurable clinical metrics.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-1">Assessment (A)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Primary diagnoses, differential diagnoses, clinical impression, and patient progress evaluation.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-1">Plan (P)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Medications, diagnostic workup, therapy, patient instructions, follow-up timelines, and referrals.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-purple-900 dark:text-purple-200">
                <strong>Autosave Protection:</strong> When using the manual entry tab, your progress is continuously autosaved to your local browser session. Reloading never loses your clinical draft.
              </p>
            </div>
          </section>

          {/* PDF & Signing */}
          <section id="pdf-export" className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <PenTool className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. PDF Generation &amp; Clinical Signatures</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Clinical notes can be converted into formatted PDF encounter summaries:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-2">
              <li><strong>Interactive Signature Canvas:</strong> Draw your signature directly with a mouse, trackpad, or stylus.</li>
              <li><strong>Electronic Attestation:</strong> If no drawn signature is added, typing your clinician name produces a clean legal electronic verification line.</li>
              <li><strong>Clean Output:</strong> Formatted without intrusive watermarks, fact-distorting machine translations, or stray markup artifacts.</li>
              <li><strong>Secure Cloud Storage:</strong> Generated PDFs are saved with authenticated access in encrypted cloud storage for your practice.</li>
            </ul>
          </section>

          {/* EHR Filing */}
          <section id="ehr-filing" className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Share2 className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4. EHR Filing &amp; Text Export</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              ClinicalScribe produces <strong>export-ready notes your staff files in minutes</strong> into any EHR or practice management system.
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">One-Click Clipboard Copy</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Copy individual SOAP sections or the entire note with a single click. A small "Copied" toast confirms the text is ready to paste into Epic, Cerner, AthenaHealth, or any clinical software.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Text (.txt) Export</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Export complete encounter notes as universal raw text files for easy attachment to electronic health record records or archival storage.
                </p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">5. Security &amp; Data Privacy</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Protecting sensitive health records is our core architectural priority:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">256-bit Encryption</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  TLS 1.2+ encryption for all data in transit, and AES-256 encryption for all data at rest.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Practice Isolation</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Multi-tenant isolation ensures your clinical encounters and notes are accessible only by your authenticated clinic staff.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 sm:col-span-2">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Sub-Processor Compliance &amp; BAAs</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  All upstream infrastructure and AI transcription providers processing clinical audio operate under Business Associate Agreements (BAAs) with zero data retention for model training.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Support Callout */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Need personalized assistance?</h2>
          <p className="text-purple-100 max-w-xl mx-auto mb-6 text-sm sm:text-base">
            Our clinical support team is here to help you get the most out of ClinicalScribe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-white text-purple-700 rounded-xl hover:bg-purple-50 font-bold transition shadow"
            >
              Contact Support
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-800 font-bold transition border border-purple-500"
            >
              View Beta Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
