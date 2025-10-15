'use client'

export default function TermsPage() {
  return (
    <main className="min-h-screen container mx-auto px-4 py-16 prose prose-invert">
      <h1>Terms of Service - ViralitYT</h1>
      <p>Last updated: {new Date().toISOString().split('T')[0]}</p>
      <h2>Acceptance</h2>
      <p>
        By using ViralitYT, you agree to these Terms and our Privacy Policy. You must own or have
        permission to manage any YouTube channel you connect.
      </p>
      <h2>Use of YouTube API</h2>
      <p>
        You agree to comply with YouTube Terms of Service and Community Guidelines. We provide an
        interface to YouTube Data API v3; all actions are performed with your authorization.
      </p>
      <h2>Content</h2>
      <p>
        You are responsible for the content you upload. ViralitYT does not permanently store
        videos; files are processed and deleted after upload.
      </p>
      <h2>Limits and Availability</h2>
      <p>
        Service availability depends on third-party APIs and quotas. We do not guarantee
        uninterrupted operation.
      </p>
      <h2>Liability</h2>
      <p>
        ViralitYT is provided “as-is” without warranties. We are not liable for indirect or
        consequential damages.
      </p>
      <h2>Contact</h2>
      <p>For support or inquiries, contact our support email.</p>
    </main>
  )
}


