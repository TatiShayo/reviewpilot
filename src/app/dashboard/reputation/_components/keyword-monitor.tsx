"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react'
import { ReviewData } from '@/lib/types'

interface KeywordMonitorProps {
  reviews: ReviewData[]
}

const TRACKED_KEYWORDS = [
  { word: 'slow', sentiment: 'negative' },
  { word: 'rude', sentiment: 'negative' },
  { word: 'expensive', sentiment: 'negative' },
  { word: 'excellent', sentiment: 'positive' },
  { word: 'amazing', sentiment: 'positive' },
]

export function KeywordMonitor({ reviews }: KeywordMonitorProps) {
  const stats = useMemo(() => {
    return TRACKED_KEYWORDS.map(({ word, sentiment }) => {
      const count = reviews.filter(r => 
        r.text?.toLowerCase().includes(word.toLowerCase())
      ).length
      
      // For simplicity, we'll mock the trend. In a real app, we'd compare with previous period.
      const trend = count > 3 ? 'up' : count > 1 ? 'stable' : 'down'
      
      return { word, count, sentiment, trend }
    })
  }, [reviews])

  const recentMentions = useMemo(() => {
    return reviews
      .filter(r => 
        TRACKED_KEYWORDS.some(kw => r.text?.toLowerCase().includes(kw.word.toLowerCase()))
      )
      .slice(0, 3)
  }, [reviews])

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Keyword Monitoring</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map(({ word, count, sentiment, trend }) => (
            <div key={word} className="flex flex-col space-y-1 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-sm font-medium text-gray-500 capitalize">{word}</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{count}</span>
                {trend === 'up' && <ArrowUpIcon className={`w-4 h-4 ${sentiment === 'negative' ? 'text-red-500' : 'text-green-500'}`} />}
                {trend === 'down' && <ArrowDownIcon className={`w-4 h-4 ${sentiment === 'negative' ? 'text-green-500' : 'text-red-500'}`} />}
                {trend === 'stable' && <MinusIcon className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Recent Mentions</h4>
          <div className="space-y-2">
            {recentMentions.length > 0 ? (
              recentMentions.map((review) => (
                <div key={review.id} className="text-sm p-3 rounded-md bg-white border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{review.author}</span>
                    <Badge variant={review.sentiment === 'negative' ? 'destructive' : 'outline'} className={review.sentiment === 'positive' ? 'border-green-200 text-green-700 bg-green-50' : ''}>
                      {review.sentiment}
                    </Badge>
                  </div>
                  <p className="text-gray-600 italic">&ldquo;{review.text}&rdquo;</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No recent mentions found.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
