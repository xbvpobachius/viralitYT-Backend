'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api, DashboardMetrics, Account, Upload } from '@/lib/api'

function DashboardContent() {
  const searchParams = useSearchParams()
  const connected = searchParams?.get('connected')

  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [recentUploads, setRecentUploads] = useState<Upload[]>([])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [metricsRes, accountsRes, uploadsRes] = await Promise.all([
        api.getDashboardMetrics(),
        api.listAccounts(),
        api.listUploads(undefined, undefined, 20),
      ])
      setMetrics(metricsRes)
      setAccounts(accountsRes.accounts)
      setRecentUploads(uploadsRes.uploads)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    try {
      await api.updateAccountStatus(accountId, !currentStatus)
      await loadData()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'uploading': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'retry': return 'bg-orange-100 text-orange-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b/0">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600 drop-shadow-[0_0_12px_hsla(0,92%,62%,0.5)]">ViralitYT</h1>
          </Link>
          <div className="flex gap-2">
            <Link href="/themes">
              <Button variant="outline">Themes</Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline">Calendar</Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">Settings</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {connected && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
            ✅ YouTube channel connected successfully!
          </div>
        )}

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <p className="text-muted-foreground">Overview of your YouTube publishing operation</p>
            </div>
            <Link href="/onboarding">
              <Button>Add Channel</Button>
            </Link>
          </div>

          {/* Metrics Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-card/40 backdrop-blur border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Uploads Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.uploads_today || 0}</div>
                <p className="text-sm text-green-600">{metrics?.uploads_done || 0} completed</p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.uploads_scheduled || 0}</div>
                <p className="text-sm text-muted-foreground">pending uploads</p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.active_accounts || 0}</div>
                <p className="text-sm text-muted-foreground">of {metrics?.total_accounts || 0} total</p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quota Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.quota.uploads_remaining || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {metrics?.quota.projects_available || 0} projects available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quota Status */}
          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>Quota Status</CardTitle>
              <CardDescription>Daily quota usage across all API projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.quota.projects.map((project) => {
                  const percentage = (project.quota_used_today / project.daily_quota) * 100
                  return (
                    <div key={project.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{project.project_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {project.quota_used_today.toLocaleString()} / {project.daily_quota.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your YouTube channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Account</th>
                      <th className="text-left py-3 px-4">Channel ID</th>
                      <th className="text-left py-3 px-4">Theme</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-b">
                        <td className="py-3 px-4 font-medium">{account.display_name}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {account.channel_id || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{account.theme_slug}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={account.active ? 'default' : 'secondary'}>
                            {account.active ? 'Active' : 'Paused'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAccountStatus(account.id, account.active)}
                          >
                            {account.active ? 'Pause' : 'Resume'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>Latest upload activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{upload.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {upload.account_name} • {new Date(upload.scheduled_for).toLocaleString()}
                      </p>
                      {upload.error && (
                        <p className="text-sm text-red-600 mt-1">{upload.error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                        {upload.status}
                      </span>
                      {upload.youtube_video_id && (
                        <a
                          href={`https://youtube.com/watch?v=${upload.youtube_video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {recentUploads.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No uploads yet. Start by scanning themes and scheduling videos!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

