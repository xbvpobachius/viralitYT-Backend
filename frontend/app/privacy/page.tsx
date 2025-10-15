'use client'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen container mx-auto px-4 py-16 prose prose-invert">
      <h1>Privacy Policy – ViralitYT</h1>
      <p><strong>Last updated:</strong> {new Date().toISOString().split('T')[0]}</p>

      <h2>Who we are</h2>
      <p>
        ViralitYT is a software-as-a-service that helps creators discover, schedule and publish
        YouTube Shorts across the channels they own or manage. We strive to collect and process the
        minimum data necessary to provide the service.
      </p>

      <h2>Data we collect and process</h2>
      <ul>
        <li>
          <strong>Google/YouTube OAuth tokens</strong> to authenticate your account and act on your
          behalf for the scopes you explicitly grant. Tokens are stored server-side only.
        </li>
        <li>
          <strong>Channel and video metadata</strong> (read-only) retrieved via YouTube Data API v3
          to discover content and display information in the dashboard.
        </li>
        <li>
          <strong>Scheduling metadata</strong> you provide (titles, descriptions, tags, schedule
          times) to create and manage upload jobs.
        </li>
        <li>
          <strong>Operational logs and quota metrics</strong> for troubleshooting and capacity
          planning.
        </li>
      </ul>

      <h2>Data we do not store</h2>
      <ul>
        <li>
          <strong>No permanent video storage.</strong> Any temporary files used during processing are
          deleted immediately after upload (cleanup runs in a <em>finally</em> block).
        </li>
        <li>
          <strong>No sale of personal data.</strong> We do not sell or rent your data to third
          parties.
        </li>
      </ul>

      <h2>Use of YouTube API Services</h2>
      <p>
        ViralitYT uses the YouTube Data API v3 strictly for the purposes you authorize: reading
        channel/video metadata and uploading videos on your behalf. Your use of YouTube is governed
        by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">YouTube
        Terms of Service</a> and the <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a>.
      </p>
      <p>
        You may revoke ViralitYT access at any time from your Google Account security settings:
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
          https://myaccount.google.com/permissions
        </a>.
      </p>

      <h2>Legal bases, retention and your rights</h2>
      <ul>
        <li>
          <strong>Legal basis.</strong> We process your data to perform the service you request
          (contract) and based on your consent for OAuth scopes.
        </li>
        <li>
          <strong>Retention.</strong> OAuth tokens and scheduling metadata are kept while your
          account remains active or until you revoke access. Operational logs are retained for a
          limited period for debugging and compliance.
        </li>
        <li>
          <strong>Your rights.</strong> Where applicable (e.g., GDPR/CCPA), you can request access,
          correction, export or deletion of your data. Contact us to exercise these rights.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        Secrets are stored as environment variables; OAuth tokens remain on the server and are never
        sent to the client. We apply least‑privilege principles and remove temporary files after
        processing.
      </p>

      <h2>Sub‑processors</h2>
      <p>
        We rely on reputable infrastructure providers (e.g., hosting, database, CI/CD) to operate
        the service. These providers process data on our behalf under contractual safeguards.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The “Last updated” date indicates the latest
        revision. Significant changes will be communicated through the app.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy inquiries, contact our support team at <strong>support@viralityt.es</strong> (o
        el email que figure en tu dominio) y atenderemos tu solicitud.
      </p>
    </main>
  )
}



