'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMockReviews, type ReviewData } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, ExternalLink, MessageSquare } from 'lucide-react'

interface ResponseRecord {
  id: string
  review_id: string
  business_id: string
  approved_tone: string | null
  approved: boolean
  posted_to_google: boolean
  posted_at: string | null
  created_at: string
  businesses: { name: string } | null
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<ResponseRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase
            .from('responses')
            .select('*, businesses(name)')
            .order('created_at', { ascending: false })

          if (!error && data) {
            setResponses(data as ResponseRecord[])
            setLoading(false)
            return
          }
        }

        // Mock fallback
        const mockReviews = getMockReviews()
        const mockResponses: ResponseRecord[] = mockReviews.slice(0, 4).map((r, i) => ({
          id: `mock-resp-${i}`,
          review_id: r.id,
          business_id: r.business_id,
          approved_tone: i === 0 ? 'professional' : i === 1 ? 'friendly' : 'brief',
          approved: true,
          posted_to_google: i < 2,
          posted_at: i < 2 ? new Date(Date.now() - (i + 1) * 86400000).toISOString() : null,
          created_at: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
          businesses: { name: r.business_name },
        }))
        setResponses(mockResponses)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const mockReviews = getMockReviews()
  const reviewMap = new Map(mockReviews.map((r) => [r.id, r]))

  function getReviewInfo(response: ResponseRecord): ReviewData | undefined {
    return reviewMap.get(response.review_id)
  }

  if (loading) {
    return (
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold">Responses</h2>
        <p className="mt-4 text-muted-foreground">Loading responses...</p>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <h2 className="text-2xl font-bold">Response History</h2>
      <p className="mt-1 text-muted-foreground">
        All approved and posted responses across your businesses. {responses.length} total.
      </p>

      {responses.length === 0 ? (
        <div className="mt-16 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No responses yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and approve responses from the Reviews page.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {responses.map((resp) => {
            const review = getReviewInfo(resp)
            return (
              <Card key={resp.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {resp.businesses?.name || 'Unknown Business'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {resp.approved_tone}
                      </Badge>
                      {resp.posted_to_google ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                          <Check className="h-3 w-3" />
                          Posted
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not posted</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {review && (
                    <>
                      <div className="text-sm">
                        <span className="font-medium">{review.author}</span>
                        <span className="text-yellow-500 ml-2">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{review.text}</p>
                    </>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(resp.created_at).toLocaleDateString()} &middot;{' '}
                    {resp.posted_at
                      ? `Posted ${new Date(resp.posted_at).toLocaleDateString()}`
                      : 'Awaiting post'}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
