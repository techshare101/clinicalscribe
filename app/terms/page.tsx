export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-4">Last updated: January 2024</p>
      <p className="text-lg text-slate-700 mb-8">
        These Terms govern your use of ClinicalScribe. By accessing or using our
        platform, you agree to these Terms.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p className="text-slate-700">
          By creating an account or using ClinicalScribe, you agree to be bound by these
          Terms of Service and our Privacy Policy. If you disagree with any part of these
          terms, please do not use our service.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">2. Use of Service</h2>
        <div className="text-slate-700 space-y-2">
          <p>You agree to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use ClinicalScribe only for lawful clinical documentation purposes</li>
            <li>Maintain the accuracy of your account information</li>
            <li>Comply with HIPAA and other applicable healthcare regulations</li>
            <li>Not attempt to reverse engineer or compromise our systems</li>
          </ul>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
        <div className="text-slate-700 space-y-2">
          <p>
            You are responsible for safeguarding your password and for all activities
            that occur under your account. You must notify us immediately of any
            unauthorized use.
          </p>
          <p>
            ClinicalScribe reserves the right to refuse service, terminate accounts,
            or remove content at our sole discretion.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">4. Beta Service</h2>
        <p className="text-slate-700">
          ClinicalScribe is currently in Beta. Features may change, and the service
          may experience interruptions. We appreciate your feedback during this phase.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">5. Payments & Subscriptions</h2>
        <div className="text-slate-700 space-y-2">
          <p>For paid plans:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Payment is processed securely through Stripe</li>
            <li>Subscriptions auto-renew unless canceled before the renewal date</li>
            <li>Refunds are provided only as required by law</li>
            <li>Price changes will be communicated 30 days in advance</li>
          </ul>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">6. AI-Generated Content</h2>
        <p className="text-slate-700">
          ClinicalScribe uses AI to generate transcriptions and documentation.
          <strong> All AI-generated content must be reviewed and verified by qualified
          healthcare professionals</strong> before use in patient care. We are not
          responsible for errors in AI output.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">7. Data Security & HIPAA</h2>
        <p className="text-slate-700">
          While ClinicalScribe implements HIPAA-ready security measures, full HIPAA
          compliance requires signed Business Associate Agreements (BAAs). Contact us
          to discuss BAA requirements for your organization.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">8. Intellectual Property</h2>
        <div className="text-slate-700 space-y-2">
          <p>
            The ClinicalScribe platform, including its design, features, and content,
            is protected by copyright and other intellectual property laws.
          </p>
          <p>
            You retain ownership of the clinical documentation you create using our
            service. You grant us a limited license to process and store your content
            solely to provide the service.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">9. Limitation of Liability</h2>
        <div className="text-slate-700 space-y-2">
          <p className="font-semibold">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>ClinicalScribe is provided "AS IS" without warranties</li>
            <li>We are not liable for any indirect, incidental, or consequential damages</li>
            <li>Our total liability shall not exceed the amount paid by you in the past 12 months</li>
            <li>We are not responsible for clinical decisions made using our service</li>
          </ul>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">10. Termination</h2>
        <p className="text-slate-700">
          Either party may terminate this agreement at any time. Upon termination,
          your access to the service will cease, but these Terms shall survive with
          respect to any ongoing obligations.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">11. Governing Law</h2>
        <p className="text-slate-700">
          These Terms are governed by the laws of Delaware, United States, without
          regard to conflict of law principles. Any disputes shall be resolved in
          the courts of Delaware.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">12. Changes to Terms</h2>
        <p className="text-slate-700">
          We may update these Terms from time to time. We'll notify you of material
          changes via email or in-app notification. Continued use after changes
          constitutes acceptance.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">13. Contact</h2>
        <p className="text-slate-700">
          For questions about these Terms, contact{" "}
          <a href="mailto:legal@clinicalscribe.com" className="text-purple-600 underline hover:text-purple-700 transition">
            legal@clinicalscribe.com
          </a>.
        </p>
      </section>

      <div className="mt-12 p-4 rounded-lg bg-slate-100 border border-slate-200">
        <p className="text-sm text-slate-600">
          By using ClinicalScribe, you acknowledge that you have read, understood,
          and agree to be bound by these Terms of Service.
        </p>
      </div>
    </main>
  );
}
