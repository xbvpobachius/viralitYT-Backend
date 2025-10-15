'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api, Upload, Account } from '@/lib/api'

export default function CalendarPage() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState<number>(new Date().getMonth())
  const [year, setYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    loadData()
  }, [selectedAccount])

  const loadData = async () => {
    try {
      const [uploadsRes, accountsRes] = await Promise.all([
        api.listUploads(selectedAccount || undefined, undefined, 500),
        api.listAccounts(),
      ])
      setUploads(uploadsRes.uploads)
      setAccounts(accountsRes.accounts)
    } catch (err) {
      console.error('Error loading calendar:', err)
    } finally {
      setLoading(false)
    }
  }

  const getUploadsByDate = () => {
    const byDate: Record<string, Upload[]> = {}
    
    uploads.forEach((upload) => {
      const date = new Date(upload.scheduled_for).toISOString().split('T')[0]
      if (!byDate[date]) {
        byDate[date] = []
      }
      byDate[date].push(upload)
    })

    return byDate
  }

  const getMonthDays = () => {
    const firstDay = new Date(year, month, 1)
    const startWeekday = firstDay.getDay() // 0-6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const grid: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) grid.push(null)
    for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d))
    while (grid.length % 7 !== 0) grid.push(null)
    return grid
  }

  const uploadsByDate = getUploadsByDate()
  const gridDays = getMonthDays()
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const prevMonth = () => {
    const d = new Date(year, month, 1)
    d.setMonth(d.getMonth() - 1)
    setMonth(d.getMonth()); setYear(d.getFullYear())
  }
  const nextMonth = () => {
    const d = new Date(year, month, 1)
    d.setMonth(d.getMonth() + 1)
    setMonth(d.getMonth()); setYear(d.getFullYear())
  }

  const rescheduleUpload = async (upload: Upload) => {
    const iso = prompt('Nueva fecha/hora (ISO 8601):', upload.scheduled_for)
    if (!iso) return
    try {
      await api.updateUpload(upload.id, { scheduled_for: iso })
      await loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const deleteUpload = async (upload: Upload) => {
    if (!confirm('Eliminar este upload?')) return
    try {
      await api.deleteUpload(upload.id)
      await loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500'
      case 'scheduled': return 'bg-blue-500'
      case 'uploading': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      case 'retry': return 'bg-orange-500'
      default: return 'bg-gray-500'
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
            <Link href="/themes">
              <Button variant="outline">Themes</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Upload Calendar</h2>
              <p className="text-muted-foreground">View scheduled uploads across all accounts</p>
            </div>
            <div className="w-64">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Legend */}
              <Card className="bg-card/40 backdrop-blur border-border/40">
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Uploading</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Done</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm">Retry</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={prevMonth}>Prev</Button>
              <Button variant="outline" onClick={nextMonth}>Next</Button>
            </div>
            <h3 className="text-xl font-bold">{monthLabel}</h3>
            <div />
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="text-xs text-muted-foreground text-center">{d}</div>
            ))}
            {gridDays.map((day, idx) => {
              const dateKey = day ? day.toISOString().split('T')[0] : ''
              const dayUploads = day ? (uploadsByDate[dateKey] || []) : []
              const isToday = day ? new Date().toDateString() === day.toDateString() : false

              return (
                <Card key={idx} className={`min-h-[120px] ${isToday ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{day ? day.getDate() : ''}</CardTitle>
                      {day && <CardDescription className="text-xs">{dayUploads.length}</CardDescription>}
                    </div>
                  </CardHeader>
                  <CardContent className="px-2 pb-2">
                    <div className="space-y-1">
                      {dayUploads
                        .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
                        .slice(0, 4)
                        .map((upload) => (
                          <div key={upload.id} className="group flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(upload.status)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-xs">{upload.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(upload.scheduled_for).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="hidden group-hover:flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => rescheduleUpload(upload)}>Move</Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteUpload(upload)}>Del</Button>
                            </div>
                          </div>
                        ))}
                      {dayUploads.length > 4 && (
                        <p className="text-[10px] text-muted-foreground">+{dayUploads.length - 4} more</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Scheduled</p>
                  <p className="text-2xl font-bold">
                    {uploads.filter(u => u.status === 'scheduled').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {uploads.filter(u => u.status === 'done').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {uploads.filter(u => u.status === 'failed').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {uploads.filter(u => u.status === 'uploading').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

