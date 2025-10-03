export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-4">Last updated: January 2024</p>
      <p className="text-lg text-slate-700 mb-8">
        Your privacy is important to us. This Privacy Policy explains how
        ClinicalScribe collects, uses, and protects your information.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">🔍 Information We Collect</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li><strong>Account Information:</strong> Name, email address, professional role, and organization.</li>
          <li><strong>Clinical Data:</strong> Transcriptions, SOAP notes, and PDFs you create using our platform.</li>
          <li><strong>Usage Data:</strong> Device information, browser type, IP address, and session analytics.</li>
          <li><strong>Payment Information:</strong> Processed securely by Stripe (we don't store card details).</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">💾 How We Use Your Data</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>To provide and improve ClinicalScribe's transcription and documentation features.</li>
          <li>To personalize your experience and remember your preferences.</li>
          <li>To monitor system performance, security, and prevent abuse.</li>
          <li>To communicate important updates and respond to support requests.</li>
          <li>To improve AI accuracy through aggregated, de-identified usage patterns.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">🤝 Data Sharing</h2>
        <p className="text-slate-700 mb-4">We <strong>never</strong> sell your personal or clinical data. We may share data only:</p>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>With your explicit consent or at your direction.</li>
          <li>With service providers who help operate our platform (under strict confidentiality).</li>
          <li>To comply with legal obligations or valid legal requests.</li>
          <li>In aggregated, anonymized form for research or analytics.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">🔐 Data Security</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>All data is encrypted in transit using TLS 1.2+ protocols.</li>
          <li>Data at rest is encrypted using AES-256 encryption.</li>
          <li>Access controls limit data exposure to authorized personnel only.</li>
          <li>Regular security audits and penetration testing.</li>
          <li>Secure, HIPAA-ready infrastructure providers.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">🌍 Data Location & Retention</h2>
        <p className="text-slate-700 mb-2">
          Your data is stored in secure data centers located in the United States. We retain:
        </p>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>Account data: As long as your account is active.</li>
          <li>Clinical notes: Until you delete them or close your account.</li>
          <li>Audit logs: Up to 2 years for security and compliance.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">👤 Your Rights</h2>
        <p className="text-slate-700 mb-2">You have the right to:</p>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>Access, export, or delete your personal data.</li>
          <li>Correct inaccurate information in your profile.</li>
          <li>Opt out of non-essential communications.</li>
          <li>Request a copy of all data we have about you.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">🍪 Cookies & Tracking</h2>
        <p className="text-slate-700">
          We use essential cookies for authentication and session management. 
          Analytics cookies help us understand usage patterns but can be disabled 
          in your browser settings.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">📧 Contact Us</h2>
        <p className="text-slate-700">
          For privacy questions, data requests, or concerns, contact us at{" "}
          <a href="mailto:privacy@clinicalscribe.com" className="text-purple-600 underline hover:text-purple-700 transition">
            privacy@clinicalscribe.com
          </a>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">📝 Updates to This Policy</h2>
        <p className="text-slate-700">
          We may update this Privacy Policy periodically. We'll notify you of 
          significant changes via email or in-app notification.
        </p>
      </section>
    </main>
  );
}
