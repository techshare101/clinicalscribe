export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-6 py-12 prose">
      <h1>Privacy Policy</h1>
      <p>ClinicalScribe respects your privacy. This policy describes how we handle data.</p>
      <h2>Information We Collect</h2>
      <p>We collect account information and usage analytics. Clinical data is stored only when explicitly saved by users.</p>
      <h2>Security</h2>
      <p>We apply industry best practices. Do not store PHI in non-production environments.</p>
      <h2>Your Choices</h2>
      <p>You may request deletion of your account data by contacting support.</p>
      <p className="text-sm text-gray-500">Last updated: {new Date().toISOString().slice(0,10)}</p>
    </main>
  )
}
