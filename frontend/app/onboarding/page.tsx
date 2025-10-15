'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, APIProject, Theme } from '@/lib/api'

function OnboardingContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<APIProject[]>([])
  const [themes, setThemes] = useState<Theme[]>([])

  // Step 1: Add API Project
  const [projectName, setProjectName] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  // Step 2: Connect YouTube Channel
  const [selectedProject, setSelectedProject] = useState('')
  const [accountName, setAccountName] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projectsRes, themesRes] = await Promise.all([
        api.listAPIProjects(),
        api.listThemes(),
      ])
      setProjects(projectsRes.projects)
      setThemes(themesRes.themes)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newProject = await api.createAPIProject({
        project_name: projectName,
        client_id: clientId,
        client_secret: clientSecret,
      })
      // Reload data to refresh the dropdowns
      await loadData()
      // Auto-select the newly created project
      setSelectedProject(newProject.id)
      setProjectName('')
      setClientId('')
      setClientSecret('')
      setStep(2)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await api.startOAuth({
        project_id: selectedProject,
        account_name: accountName,
        theme_slug: selectedTheme,
      })
      // Redirect to Google OAuth
      window.location.href = result.authorization_url
    } catch (err: any) {
      alert(`Error: ${err.message}`)
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
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold">Get Started</h2>
            <p className="text-muted-foreground mt-2">
              Set up your API projects and connect YouTube channels
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/40 text-destructive px-4 py-3 rounded">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                1
              </div>
              <span className="font-medium">API Project</span>
            </div>
            <div className="flex-1 h-0.5 bg-border" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                2
              </div>
              <span className="font-medium">Connect Channel</span>
            </div>
          </div>

          {/* Step 1: Add API Project */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Add Google Cloud API Project</CardTitle>
                <CardDescription>
                  Enter credentials from your Google Cloud project with YouTube Data API v3 enabled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="My YouTube Project"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      placeholder="xxxxx.apps.googleusercontent.com"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      placeholder="GOCSPX-xxxxx"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Add Project'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      {projects.length > 0 ? 'Skip (Use Existing)' : 'Next Step'}
                    </Button>
                  </div>
                </form>

                {projects.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-2">Existing Projects:</h4>
                    <ul className="space-y-1 text-sm">
                      {projects.map((p) => (
                        <li key={p.id} className="flex justify-between">
                          <span>{p.project_name}</span>
                          <span className="text-muted-foreground">
                            {p.quota_used_today} / {p.daily_quota} quota used
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Connect YouTube Channel */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Connect YouTube Channel</CardTitle>
                <CardDescription>
                  Authorize a YouTube channel to start publishing Shorts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConnectChannel} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Select API Project</Label>
                    <select
                      id="project"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      required
                    >
                      <option value="">-- Select a project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.project_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Display Name</Label>
                    <Input
                      id="accountName"
                      placeholder="My Gaming Channel"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Select Theme</Label>
                    <select
                      id="theme"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      required
                    >
                      <option value="">-- Select a theme --</option>
                      {themes.map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Connecting...' : 'Connect to YouTube'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}

