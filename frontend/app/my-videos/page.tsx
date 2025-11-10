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
  const [files, setFiles] = useState<FileList | null>(null)
  const [batch, setBatch] = useState<Array<{ video: Video; preview_url?: string; title?: string; description?: string; tags?: string }>>([])
  const [scheduledFor, setScheduledFor] = useState('')
  const [cadence, setCadence] = useState<1|2|3>(2)
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
    if (!files || files.length === 0) { alert('Select files or a ZIP'); return }
    setLoading(true)
    try {
      const list = Array.from(files)
      const resp = await api.uploadUserVideosBatch(list)
      const prepared = resp.items.map(it => ({ video: it.video, preview_url: it.preview_url, title: it.video.title || '', description: '', tags: '' }))
      setBatch(prepared)
      alert(`Uploaded ${resp.count} item(s). Review titles/descriptions and schedule.`)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  // scheduling handled in the "Schedule All" button below

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
              <CardDescription>Select MP4 files or a .zip (multi-video)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Files (.mp4 or .zip)</label>
                  <input multiple type="file" accept="video/mp4,application/zip" onChange={(e) => setFiles(e.target.files)} />
                </div>
              </div>
              <Button onClick={handleUpload} disabled={loading || !files || files.length===0}>
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
              {batch.length>0 && (
                <p className="text-sm text-green-500">Uploaded {batch.length} item(s). Edit titles/descriptions below.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>2) Review & Schedule</CardTitle>
              <CardDescription>Per video metadata and cadence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {batch.length>0 && (
                  <div className="space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-2">Preview</th>
                            <th className="text-left py-2 pr-2">Title</th>
                            <th className="text-left py-2 pr-2">Description</th>
                            <th className="text-left py-2 pr-2">Tags (comma)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batch.map((it, idx) => (
                            <tr key={String(it.video.id)} className="border-b align-top">
                              <td className="py-2 pr-2">
                                {it.preview_url ? (
                                  <video src={it.preview_url} className="w-28 h-44 object-cover rounded" controls muted />
                                ) : (
                                  <span className="text-muted-foreground">No preview</span>
                                )}
                              </td>
                              <td className="py-2 pr-2">
                                <input className="w-full rounded-md border border-input bg-background px-2 py-1"
                                  value={it.title||''}
                                  onChange={(e)=>{
                                    const v=[...batch]; v[idx].title=e.target.value; setBatch(v)
                                  }}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <textarea className="w-full rounded-md border border-input bg-background px-2 py-1" rows={3}
                                  value={it.description||''}
                                  onChange={(e)=>{
                                    const v=[...batch]; v[idx].description=e.target.value; setBatch(v)
                                  }}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input className="w-full rounded-md border border-input bg-background px-2 py-1"
                                  placeholder="#tag1,#tag2"
                                  value={it.tags||''}
                                  onChange={(e)=>{
                                    const v=[...batch]; v[idx].tags=e.target.value; setBatch(v)
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

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
                  <label className="text-sm font-medium">First video date/time</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cadence per day</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={cadence}
                    onChange={(e)=>setCadence(Number(e.target.value) as 1|2|3)}>
                    <option value={1}>1 / day</option>
                    <option value={2}>2 / day</option>
                    <option value={3}>3 / day</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={async ()=>{
                  if (!selectedAccount || !scheduledFor || batch.length===0) { alert('Complete all fields'); return }
                  setLoading(true)
                  try {
                    const items = batch.map(it=> ({
                      video_id: String(it.video.id),
                      title: it.title || undefined,
                      description: it.description || undefined,
                      tags: it.tags ? it.tags.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
                    }))
                    const res = await api.scheduleUserBulk({
                      account_id: selectedAccount,
                      start_datetime: new Date(scheduledFor).toISOString(),
                      cadence_per_day: cadence,
                      items,
                    })
                    alert(`Scheduled ${res.count} uploads`)
                    setBatch([]); setFiles(null); setScheduledFor('')
                  } catch (e:any) { alert(e.message) } finally { setLoading(false) }
                }}
                disabled={loading || !selectedAccount || !scheduledFor || batch.length===0}
              >
                {loading ? 'Scheduling...' : 'Schedule All'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


