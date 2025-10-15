'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api, Theme, Account, Video } from '@/lib/api'

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTheme) {
      loadVideos()
    }
  }, [selectedTheme])

  const loadData = async () => {
    try {
      const [themesRes, accountsRes] = await Promise.all([
        api.listThemes(),
        api.listAccounts(),
      ])
      setThemes(themesRes.themes)
      setAccounts(accountsRes.accounts)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const loadVideos = async () => {
    if (!selectedTheme) return
    setLoading(true)
    try {
      const res = await api.listVideos(selectedTheme, 'new', 100)
      setVideos(res.videos)
    } catch (err) {
      console.error('Error loading videos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScanTheme = async () => {
    if (!selectedTheme || !selectedAccount) {
      alert('Please select a theme and account')
      return
    }

    setScanning(true)
    try {
      const result = await api.scanTheme(selectedTheme, selectedAccount, searchQuery || undefined)
      alert(`Scan complete! Found ${result.videos_found} Shorts from ${result.channels_found} channels. ${result.videos_inserted} new videos added.`)
      await loadVideos()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setScanning(false)
    }
  }

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos)
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId)
    } else {
      newSelection.add(videoId)
    }
    setSelectedVideos(newSelection)
  }

  const handleAutoSchedule = async () => {
    if (!selectedAccount || selectedVideos.size === 0) {
      alert('Please select an account and at least one video')
      return
    }

    const videosArray = Array.from(selectedVideos)
    const startDate = new Date()
    startDate.setHours(startDate.getHours() + 1) // Start in 1 hour

    setLoading(true)
    try {
      const uploads = []
      for (let i = 0; i < videosArray.length; i++) {
        const scheduledFor = new Date(startDate)
        scheduledFor.setDate(scheduledFor.getDate() + Math.floor(i / 2))
        if (i % 2 === 0) {
          scheduledFor.setHours(10, 0, 0)
        } else {
          scheduledFor.setHours(18, 0, 0)
        }

        uploads.push({
          account_id: selectedAccount,
          video_id: videosArray[i],
          scheduled_for: scheduledFor.toISOString(),
        })
      }

      await api.scheduleBulkUploads(uploads)
      alert(`Successfully scheduled ${uploads.length} uploads!`)
      setSelectedVideos(new Set())
      await loadVideos()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
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
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline">Calendar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold">Themes & Videos</h2>
            <p className="text-muted-foreground">Scan for Shorts and schedule uploads</p>
          </div>

          {/* Controls */}
          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>Scan & Select</CardTitle>
              <CardDescription>Choose a theme to scan for viral Shorts (≤60s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  >
                    <option value="">-- Select theme --</option>
                    {themes.map((theme) => (
                      <option key={theme.slug} value={theme.slug}>
                        {theme.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Account (for scanning)</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    <option value="">-- Select account --</option>
                    {accounts.filter(a => a.active).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom search (optional)</label>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g. roblox clips"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">&nbsp;</label>
                  <Button
                    onClick={handleScanTheme}
                    disabled={!selectedTheme || !selectedAccount || scanning}
                    className="w-full"
                  >
                    {scanning ? 'Scanning...' : 'Scan Theme'}
                  </Button>
                </div>
              </div>

              {selectedVideos.size > 0 && (
                <div className="pt-4 border-t flex items-center justify-between">
                  <p className="text-sm">
                    {selectedVideos.size} video(s) selected
                  </p>
                  <Button onClick={handleAutoSchedule} disabled={loading}>
                    Auto-Schedule (2/day)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Videos Grid */}
          {selectedTheme && (
            <div>
              <h3 className="text-xl font-bold mb-4">
                Available Shorts ({videos.length})
              </h3>
              {loading ? (
                <p>Loading videos...</p>
              ) : (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className={`cursor-pointer transition-all ${selectedVideos.has(video.id) ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => toggleVideoSelection(video.id)}
                    >
                      <CardContent className="p-0">
                        {video.thumbnail_url && (
                          <a
                            href={`https://www.youtube.com/watch?v=${video.source_video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                          </a>
                        )}
                        <div className="p-4 space-y-2">
                          <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                          <p className="text-xs text-muted-foreground">{video.channel_title}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span>{video.views?.toLocaleString()} views</span>
                            <span>{video.duration_seconds}s</span>
                          </div>
                          {selectedVideos.has(video.id) && (
                            <Badge className="w-full justify-center">Selected</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {!loading && videos.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No videos found. Click "Scan Theme" to discover Shorts.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

