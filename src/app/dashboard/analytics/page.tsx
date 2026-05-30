'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown, Minus, Plus, Trash2, LineChart } from 'lucide-react'

interface Snapshot {
  id: string
  rating: number
  total_reviews: number
  snapshot_date: string
}

interface Competitor {
  id: string
  name: string
  business_id: string | null
  gmb_handle: string | null
  rating: number
  total_reviews: number
  snapshots: Snapshot[]
}

interface Business {
  id: string
  name: string
}

export default function AnalyticsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [gmbHandle, setGmbHandle] = useState('')
  const [rating, setRating] = useState('')
  const [totalReviews, setTotalReviews] = useState('')

  useEffect(() => {
    fetch('/api/competitors')
      .then((r) => r.json())
      .then((d) => setCompetitors(d.competitors || []))
      .catch(() => toast.error('Failed to load competitors'))
      .finally(() => setLoading(false))

    fetch('/api/businesses/list')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.businesses)) {
          setBusinesses(d.businesses)
        }
      })
      .catch(() => {})
  }, [])

  async function addCompetitor() {
    if (!name.trim()) return

    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        business_id: businessId || null,
        gmb_handle: gmbHandle.trim() || null,
        rating: parseFloat(rating) || 0,
        total_reviews: parseInt(totalReviews) || 0,
      }),
    })

    if (!res.ok) {
      toast.error('Failed to add competitor')
      return
    }

    const data = await res.json()
    setCompetitors((prev) => [...prev, { ...data.competitor, snapshots: [] }])
    setName('')
    setBusinessId('')
    setGmbHandle('')
    setRating('')
    setTotalReviews('')
    toast.success('Competitor added')
  }

  async function deleteCompetitor(id: string) {
    const res = await fetch(`/api/competitors?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete competitor')
      return
    }
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
    toast.success('Competitor removed')
  }

  async function addSnapshot(competitorId: string) {
    const r = prompt('Enter current rating (e.g. 4.2):')
    const tr = prompt('Enter total reviews count:')
    if (!r) return

    const res = await fetch('/api/competitors/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitor_id: competitorId,
        rating: parseFloat(r),
        total_reviews: parseInt(tr || '0'),
      }),
    })

    if (!res.ok) {
      toast.error('Failed to add snapshot')
      return
    }

    const data = await res.json()
    setCompetitors((prev) =>
      prev.map((c) =>
        c.id === competitorId
          ? {
              ...c,
              rating: parseFloat(r),
              total_reviews: parseInt(tr || '0'),
              snapshots: [...c.snapshots, data.snapshot],
            }
          : c
      )
    )
    toast.success('Snapshot recorded')
  }

  function getTrend(snapshots: Snapshot[]): 'up' | 'down' | 'flat' {
    if (snapshots.length < 2) return 'flat'
    const latest = snapshots[0].rating
    const previous = snapshots[snapshots.length - 1].rating
    if (latest > previous) return 'up'
    if (latest < previous) return 'down'
    return 'flat'
  }

  if (loading) {
    return (
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <h2 className="text-2xl font-bold">Analytics</h2>
      <p className="mt-2 text-muted-foreground">
        Track competitor ratings and monitor market position.
      </p>

      <div className="mt-8 rounded-lg border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Competitor Monitoring
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <Input
            placeholder="Competitor name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {businesses.length > 0 && (
            <Select value={businessId} onValueChange={(v) => setBusinessId(v || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Link to business (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            placeholder="GMB handle (optional)"
            value={gmbHandle}
            onChange={(e) => setGmbHandle(e.target.value)}
          />
          <Input
            placeholder="Current rating (e.g. 4.2)"
            type="number"
            step="0.1"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
          <Input
            placeholder="Total reviews"
            type="number"
            min="0"
            value={totalReviews}
            onChange={(e) => setTotalReviews(e.target.value)}
          />
          <Button onClick={addCompetitor} className="self-end">
            <Plus className="h-4 w-4 mr-1" />
            Add Competitor
          </Button>
        </div>

        {competitors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No competitors tracked yet. Add competitors to monitor their ratings over time.
          </p>
        ) : (
          <div className="space-y-4">
            {competitors.map((c) => {
              const trend = getTrend(c.snapshots)
              return (
                <div key={c.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      {c.gmb_handle && (
                        <p className="text-xs text-muted-foreground">@{c.gmb_handle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-lg font-bold">{c.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.total_reviews} reviews
                        </p>
                      </div>
                      <div>
                        {trend === 'up' && (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        )}
                        {trend === 'down' && (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        {trend === 'flat' && <Minus className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>

                  {c.snapshots.length > 0 && (
                    <div className="mt-3 flex items-end gap-1 h-16">
                      {c.snapshots
                        .slice()
                        .reverse()
                        .slice(-12)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="flex-1 bg-orange-500/30 rounded-t"
                            style={{
                              height: `${((s.rating - 1) / 4) * 100}%`,
                            }}
                            title={`${s.rating} — ${new Date(s.snapshot_date).toLocaleDateString()}`}
                          />
                        ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => addSnapshot(c.id)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Snapshot
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCompetitor(c.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
