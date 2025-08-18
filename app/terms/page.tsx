export default function TermsPage() {
  return (
    <main className="container mx-auto px-6 py-12 prose">
      <h1>Terms of Service</h1>
      <p>Welcome to ClinicalScribe. By accessing or using our services, you agree to the following terms.</p>
      <h2>Use of Service</h2>
      <p>ClinicalScribe is provided for clinical documentation assistance. You are responsible for complying with applicable laws and institutional policies.</p>
      <h2>Data</h2>
      <p>You must not upload PHI unless you have proper authorization. Beta environments are provided as-is without warranties.</p>
      <h2>Limitation of Liability</h2>
      <p>We are not liable for indirect or consequential damages arising from use of the service.</p>
      <p className="text-sm text-gray-500">Last updated: {new Date().toISOString().slice(0,10)}</p>
    </main>
  )
}
