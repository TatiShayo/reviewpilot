import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogoutButton } from './logout-button'
import { getDashboardStats } from '@/lib/mock-data'
import { MessageSquare, Star, Percent, MapPin } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const stats = getDashboardStats()

  const cards = [
    {
      label: 'Reviews Today',
      value: stats.reviewsToday,
      icon: MessageSquare,
      color: 'text-blue-500',
    },
    {
      label: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: Percent,
      color: 'text-green-500',
    },
    {
      label: 'Avg Rating',
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',
      icon: Star,
      color: 'text-yellow-500',
    },
    {
      label: 'Locations',
      value: stats.locationsCount,
      icon: MapPin,
      color: 'text-purple-500',
    },
  ]

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">ReviewPilot</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="mt-2 text-muted-foreground">Your review management overview.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{card.value}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold">Recent Reviews</h3>
          {stats.recentReviews.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {stats.recentReviews.map((review) => (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.author}</span>
                        <span className="text-yellow-500">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{review.business_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.date.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{review.text}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        review.sentiment === 'positive'
                          ? 'bg-green-100 text-green-700'
                          : review.sentiment === 'negative'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {review.sentiment}
                    </span>
                    {!review.response && (
                      <Button variant="outline" size="sm">
                        Generate Response
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
