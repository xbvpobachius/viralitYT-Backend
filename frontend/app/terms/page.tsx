'use client'

export default function TermsPage() {
  return (
    <main className="min-h-screen container mx-auto px-4 py-16 prose prose-invert">
      <h1>Terms of Service – ViralitYT</h1>
      <p><strong>Last updated:</strong> {new Date().toISOString().split('T')[0]}</p>

      <h2>1. Acceptance</h2>
      <p>
        By using ViralitYT, you agree to these Terms and to our Privacy Policy. You represent that
        you own or are authorized to manage any YouTube channel you connect to the service.
      </p>

      <h2>2. Use of YouTube API Services</h2>
      <p>
        You agree to comply with the
        <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer"> YouTube Terms of Service</a>
        and the <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a>.
        ViralitYT uses the YouTube Data API v3 to read channel/video metadata and upload videos on
        your behalf strictly within the scopes you grant via OAuth.
      </p>

      <h2>3. Accounts and Access</h2>
      <p>
        You are responsible for safeguarding your credentials and access tokens. You may revoke
        ViralitYT access at any time via your Google Account:
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer"> https://myaccount.google.com/permissions</a>.
      </p>

      <h2>4. Content and Intellectual Property</h2>
      <p>
        You are solely responsible for the content you upload or schedule through ViralitYT,
        including any necessary rights or permissions. ViralitYT does not permanently store video
        files; temporary processing artifacts are deleted after upload.
      </p>

      <h2>5. Service Limits and Availability</h2>
      <p>
        Service availability depends on third‑party APIs, quotas, and infrastructure providers.
        We do not guarantee uninterrupted operation or specific performance outcomes.
      </p>

      <h2>6. Prohibited Use</h2>
      <p>
        You agree not to misuse the service, including but not limited to attempting to circumvent
        API quotas, violating YouTube policies, or uploading unlawful content.
      </p>

      <h2>7. Disclaimers and Limitation of Liability</h2>
      <p>
        ViralitYT is provided on an “as‑is” and “as‑available” basis without warranties of any
        kind. To the maximum extent permitted by law, we are not liable for indirect, incidental,
        special, or consequential damages arising from your use of the service.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these Terms from time to time. The “Last updated” date reflects the latest
        revision. Continued use after changes constitutes acceptance of the new Terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        For support or inquiries, contact us at <strong>support@viralityt.es</strong>.
      </p>
    </main>
  )
}


