export default function HipaaPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">HIPAA Compliance</h1>
      <p className="text-lg text-slate-700 mb-8">
        ClinicalScribe is built with privacy and security at its core. While we
        are not yet a covered entity or business associate under HIPAA, our
        platform is designed to follow HIPAA-ready practices so healthcare teams
        can confidently evaluate and pilot our solution.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">🔒 Data Security</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>All Protected Health Information (PHI) is encrypted in transit using TLS 1.2+.</li>
          <li>Data at rest is encrypted using AES-256 across our databases and storage buckets.</li>
          <li>Role-based access controls ensure users can only access their own data.</li>
          <li>Administrative actions are logged with full audit trails in <code className="bg-gray-100 px-1 rounded">admin_actions</code>.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">🧾 Compliance Practices</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>Patient data is never shared with third parties without authorization.</li>
          <li>All infrastructure is hosted on HIPAA-ready, US-based cloud providers.</li>
          <li>We follow NIST and OWASP guidelines for secure coding and system hardening.</li>
          <li>Audit logging and monitoring are active across admin and system events.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">📑 Business Associate Agreements (BAAs)</h2>
        <p className="text-slate-700">
          We are in the process of finalizing Business Associate Agreements (BAAs)
          with our infrastructure providers. For early pilots, we operate under a
          HIPAA-ready model to ensure PHI is handled with industry-standard security
          measures.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">📩 Contact Us</h2>
        <p className="text-slate-700">
          For questions about HIPAA compliance, audits, or security practices,
          contact us at{" "}
          <a
            href="mailto:support@clinicalscribe.com"
            className="text-purple-600 underline hover:text-purple-700 transition"
          >
            support@clinicalscribe.com
          </a>.
        </p>
      </section>

      <div className="mt-12 p-4 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">
        ⚠️ <strong>Disclaimer:</strong> ClinicalScribe is currently in Beta. While
        designed with HIPAA-ready safeguards, full HIPAA compliance depends on
        signed BAAs with providers and production deployments.
      </div>
    </main>
  );
}
