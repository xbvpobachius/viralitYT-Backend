'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, Theme } from '@/lib/api'

export default function SettingsPage() {
  const [themes, setThemes] = useState<Theme[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const themesRes = await api.listThemes()
      setThemes(themesRes.themes)
    } catch (err) {
      console.error('Error loading settings:', err)
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold">Settings</h2>
            <p className="text-muted-foreground">Configure themes and defaults</p>
          </div>

          {/* Theme Settings */}
          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>Theme Configuration</CardTitle>
              <CardDescription>
                Default hashtags and search keywords for each theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {themes.map((theme) => (
                  <div key={theme.slug} className="p-4 border rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg">{theme.title}</h3>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Search Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {theme.search_keywords?.map((keyword, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-secondary text-sm rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Default Hashtags</p>
                      <div className="flex flex-wrap gap-2">
                        {theme.default_hashtags?.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upload Settings */}
          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>Upload Settings</CardTitle>
              <CardDescription>
                Default configuration for uploads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Video Filter</p>
                  <p className="text-sm text-muted-foreground">ONLY Shorts (1-60 seconds)</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Upload Visibility</p>
                  <p className="text-sm text-muted-foreground">Videos are uploaded as unlisted by default</p>
                </div>
                <span className="px-3 py-1 bg-secondary rounded text-sm">Unlisted</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Schedule</p>
                  <p className="text-sm text-muted-foreground">2 uploads per day at 10:00 AM and 6:00 PM</p>
                </div>
                <span className="px-3 py-1 bg-secondary rounded text-sm">2/day</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Time Jitter</p>
                  <p className="text-sm text-muted-foreground">Random offset to avoid patterns</p>
                </div>
                <span className="px-3 py-1 bg-secondary rounded text-sm">±30 minutes</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Max Retries</p>
                  <p className="text-sm text-muted-foreground">Failed uploads retry up to 3 times</p>
                </div>
                <span className="px-3 py-1 bg-secondary rounded text-sm">3 retries</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">File Storage</p>
                  <p className="text-sm text-muted-foreground">Videos ALWAYS deleted after upload</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">Zero Storage</span>
              </div>
            </CardContent>
          </Card>

          {/* Worker Settings */}
          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>Worker Settings</CardTitle>
              <CardDescription>
                Background job processing configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Poll Interval</p>
                  <p className="text-sm text-muted-foreground">How often worker checks for jobs</p>
                </div>
                <span className="px-3 py-1 bg-secondary rounded text-sm">60 seconds</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Batch Size</p>
                  <p className="text-sm text-muted-foreground">Max uploads processed per cycle</p>
                </div>
                <span className="px-3 py-1 bg-secondary rounded text-sm">5 uploads</span>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Backend and deployment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Base URL</span>
                <code className="px-2 py-1 bg-secondary rounded text-xs">
                  {process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frontend Version</span>
                <code className="px-2 py-1 bg-secondary rounded text-xs">1.0.0</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Database Storage</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  Metadata only (no videos)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

