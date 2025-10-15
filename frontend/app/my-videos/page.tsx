'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, Account, Theme, Video } from '@/lib/api'

export default function MyVideosPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [video, setVideo] = useState<Video | null>(null)
  const [scheduledFor, setScheduledFor] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [accRes, thRes] = await Promise.all([api.listAccounts(), api.listThemes()])
        setAccounts(accRes.accounts)
        setThemes(thRes.themes)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  const handleUpload = async () => {
    if (!file || !selectedTheme) {
      alert('Select a theme and a file')
      return
    }
    setLoading(true)
    try {
      const res = await api.uploadUserVideo({ theme_slug: selectedTheme, title: title || undefined, file })
      setVideo(res.video)
      alert('Uploaded. Now schedule it!')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!video || !selectedAccount || !scheduledFor) {
      alert('Select account and schedule time')
      return
    }
    setLoading(true)
    try {
      await api.pickVideo({
        video_id: String(video.id),
        account_id: selectedAccount,
        scheduled_for: new Date(scheduledFor).toISOString(),
      })
      alert('Scheduled!')
      setVideo(null)
      setFile(null)
      setTitle('')
      setScheduledFor('')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b/0">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600 drop-shadow-[0_0_12px_hsla(0,92%,62%,0.5)]">ViralitYT</h1>
          </Link>
          <div className="flex gap-2">
            <Link href="/dashboard"><Button variant="outline">Dashboard</Button></Link>
            <Link href="/calendar"><Button variant="outline">Calendar</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold">My Videos</h2>
            <p className="text-muted-foreground">Upload your own Shorts and schedule them automatically</p>
          </div>

          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>1) Upload</CardTitle>
              <CardDescription>Choose a theme, optional title, and your MP4</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  >
                    <option value="">-- Select theme --</option>
                    {themes.map((t) => (
                      <option key={t.slug} value={t.slug}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title (optional)</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Short"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File (MP4)</label>
                  <input type="file" accept="video/mp4" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <Button onClick={handleUpload} disabled={loading || !file || !selectedTheme}>
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
              {video && (
                <p className="text-sm text-green-500">Uploaded: {video.title}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>2) Schedule</CardTitle>
              <CardDescription>Select account and time (ISO or local)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    <option value="">-- Select account --</option>
                    {accounts.filter(a => a.active).map((a) => (
                      <option key={a.id} value={a.id}>{a.display_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">When</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSchedule} disabled={loading || !video || !selectedAccount || !scheduledFor}>
                {loading ? 'Scheduling...' : 'Schedule Upload'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


