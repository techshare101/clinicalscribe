import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Clock, Shield, ArrowLeft, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Support | ClinicalScribe',
  description: 'Get in touch with ClinicalScribe support and sales team.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1.5 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="inline-flex p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mb-6">
            <MessageSquare className="w-6 h-6" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
            Contact Support
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            Have questions about ClinicalScribe, feedback on our Beta, or need help with your account? Our team is standing by to help.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="p-2.5 rounded-xl bg-purple-600 text-white flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Email Us Directly</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  For support inquiries, bug reports, and account questions:
                </p>
                <a
                  href="mailto:support@clinicalscribe.io"
                  className="inline-block mt-2 font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  support@clinicalscribe.io
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Response Time</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  During Beta, our team typically responds within <strong>2 to 4 business hours</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Privacy &amp; Security Requests</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  For data requests, clinic agreements, or security questions, review our{' '}
                  <Link href="/privacy" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  or contact our privacy desk.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4">
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition"
            >
              Read Documentation
            </Link>
            <Link
              href="/pricing"
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              View Beta Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
