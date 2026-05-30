'use client'

import { useState } from 'react'
import { getMockReviews, type ReviewData } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ArrowUpDown, Check, ExternalLink } from 'lucide-react'

export default function ReviewsPage() {
  const [reviews] = useState<ReviewData[]>(() => getMockReviews())
  const [search, setSearch] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  let filtered = reviews.filter((r) => {
    if (search && !r.text.toLowerCase().includes(search.toLowerCase()) && !r.author.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (sentimentFilter !== 'all' && r.sentiment !== sentimentFilter) {
      return false
    }
    if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter)) {
      return false
    }
    return true
  })

  if (sortBy === 'newest') {
    filtered = [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime())
  } else if (sortBy === 'oldest') {
    filtered = [...filtered].sort((a, b) => a.date.getTime() - b.date.getTime())
  } else if (sortBy === 'highest') {
    filtered = [...filtered].sort((a, b) => b.rating - a.rating)
  } else if (sortBy === 'lowest') {
    filtered = [...filtered].sort((a, b) => a.rating - b.rating)
  }

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <h2 className="text-2xl font-bold">Reviews</h2>
      <p className="mt-1 text-muted-foreground">
        All reviews across your businesses. {reviews.length} total.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select onValueChange={(v) => setSentimentFilter(v || 'all')} defaultValue="all">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setRatingFilter(v || 'all')} defaultValue="all">
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {'★'.repeat(n)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setSortBy(v || 'newest')} defaultValue="newest">
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="h-3 w-3" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          <p>No reviews match your filters.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </main>
  )
}

function ReviewCard({ review }: { review: ReviewData }) {
  const [generating, setGenerating] = useState(false)
  const [responses, setResponses] = useState<Record<string, string> | null>(null)
  const [selectedTone, setSelectedTone] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [posted, setPosted] = useState(false)
  const [posting, setPosting] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_text: review.text,
          author: review.author,
          rating: review.rating,
          business_name: review.business_name,
          business_id: review.business_id,
        }),
      })
      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()
      setResponses(data.responses)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  async function handleApprove() {
    if (!responses || !selectedTone) return
    setApproving(true)
    try {
      const supabase = createClient()
      let user = null
      try {
        const { data } = await supabase.auth.getUser()
        user = data.user
      } catch {
        // Supabase unavailable (e.g. e2e tests) — proceed in mock mode
      }

      if (user) {
        const { error } = await supabase.from('responses').insert({
          review_id: review.id,
          business_id: review.business_id,
          professional: responses.professional || null,
          friendly: responses.friendly || null,
          brief: responses.brief || null,
          approved_tone: selectedTone,
          approved: true,
        })
        if (error) throw error
      }

      setApproved(true)
      toast.success('Response approved' + (user ? '' : ' (mock)'))
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve')
    } finally {
      setApproving(false)
    }
  }

  async function handlePostToGoogle() {
    setPosting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from('responses')
          .update({ posted_to_google: true, posted_at: new Date().toISOString() })
          .eq('review_id', review.id)
          .eq('approved', true)

        if (error) throw error
      }

      setPosted(true)
      const gmbUrl = `https://business.google.com/reviews/l/${review.business_id}`
      window.open(gmbUrl, '_blank')
      toast.success('Opening Google My Business')
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{review.author}</span>
            <span className="text-yellow-500">
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                review.sentiment === 'positive'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : review.sentiment === 'negative'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {review.sentiment}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {review.business_name} &middot; {review.date.toLocaleDateString()}
          </p>
          <p className="mt-2 text-sm leading-relaxed">{review.text}</p>
        </div>
        {!responses && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="shrink-0"
          >
            {generating ? 'Generating...' : 'Generate Response'}
          </Button>
        )}
      </div>

      {responses && !selectedTone && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground">Choose a response tone:</p>
          {(Object.entries(responses) as [string, string][]).map(([tone, text]) => (
            <div key={tone} className="rounded-md border p-3 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tone}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setSelectedTone(tone)}>
                  Use this
                </Button>
              </div>
              <p className="text-sm">{text}</p>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setResponses(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {selectedTone && responses && !approved && (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
              ✓ Selected: {selectedTone}
            </span>
          </div>
          <p className="text-sm bg-green-50 dark:bg-green-950 p-3 rounded-md border border-green-200 dark:border-green-800">
            {responses[selectedTone]}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={handleApprove} disabled={approving}>
              {approving ? 'Approving...' : 'Approve'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedTone(null); setResponses(null) }}>
              Back
            </Button>
          </div>
        </div>
      )}

      {approved && (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Response approved — {selectedTone} tone
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {responses?.[selectedTone || '']}
          </p>
          {!posted && (
            <Button
              size="sm"
              className="mt-3"
              onClick={handlePostToGoogle}
              disabled={posting}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {posting ? 'Posting...' : 'Post to Google'}
            </Button>
          )}
          {posted && (
            <p className="mt-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Posted to Google My Business
            </p>
          )}
        </div>
      )}
    </div>
  )
}
