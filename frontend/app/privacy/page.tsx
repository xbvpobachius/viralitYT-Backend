'use client'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen container mx-auto px-4 py-16 prose prose-invert">
      <h1>Privacy Policy - ViralitYT</h1>
      <p>Last updated: {new Date().toISOString().split('T')[0]}</p>
      <h2>Overview</h2>
      <p>
        ViralitYT is a tool that helps creators discover, schedule and publish YouTube Shorts
        across multiple channels they own or manage. We only access the minimum data necessary to
        provide these features.
      </p>
      <h2>Data We Access</h2>
      <ul>
        <li>OAuth tokens to act on your behalf (kept server-side, never exposed to the frontend).</li>
        <li>Channel metadata and video lists (read-only) via YouTube Data API v3.</li>
        <li>Scheduled uploads metadata (titles, descriptions, tags) you provide.</li>
      </ul>
      <h2>What We Do Not Store</h2>
      <ul>
        <li>No video files are permanently stored; temporary files are deleted after upload.</li>
        <li>No sensitive personal information beyond OAuth tokens and basic account identifiers.</li>
      </ul>
      <h2>How We Use Your Data</h2>
      <ul>
        <li>To authenticate with YouTube and manage uploads on channels you authorize.</li>
        <li>To scan themes and discover public Shorts for scheduling.</li>
        <li>To compute quotas and basic operational metrics.</li>
      </ul>
      <h2>Sharing</h2>
      <p>We do not sell or share your data with third parties.</p>
      <h2>Security</h2>
      <p>
        Secrets are managed via environment variables. OAuth tokens are stored server-side and
        never sent to the client.
      </p>
      <h2>Contact</h2>
      <p>For questions or requests, contact our support email.</p>
    </main>
  )
}


