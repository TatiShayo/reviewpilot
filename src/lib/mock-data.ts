export interface ReviewData {
  id: string
  business_id: string
  business_name: string
  author: string
  rating: number
  text: string
  date: Date
  sentiment: 'positive' | 'negative' | 'neutral'
  response: string | null
}

export interface DashboardStats {
  reviewsToday: number
  responseRate: number
  avgRating: number
  locationsCount: number
  totalReviews: number
  recentReviews: ReviewData[]
}

const MOCK_BUSINESSES = [
  { id: 'b1', name: 'Sunset Cafe & Bakery' },
  { id: 'b2', name: 'Coastal Dental Care' },
]

function daysAgo(n: number): Date {
  // UTC to avoid SSR mismatch across timezones
  return new Date(Date.UTC(2026, 4, 30 - n, 12, 0, 0, 0))
}

const MOCK_REVIEWS: ReviewData[] = [
  {
    id: 'r1',
    business_id: 'b1',
    business_name: 'Sunset Cafe & Bakery',
    author: 'Maria G.',
    rating: 5,
    text: 'Best croissants in town! The owner is so friendly and the coffee is always perfect. I come here every morning before work.',
    date: daysAgo(0),
    sentiment: 'positive',
    response: null,
  },
  {
    id: 'r2',
    business_id: 'b1',
    business_name: 'Sunset Cafe & Bakery',
    author: 'James T.',
    rating: 4,
    text: 'Great atmosphere and delicious pastries. Would love to see more gluten-free options on the menu.',
    date: daysAgo(1),
    sentiment: 'positive',
    response: null,
  },
  {
    id: 'r3',
    business_id: 'b2',
    business_name: 'Coastal Dental Care',
    author: 'Linda P.',
    rating: 5,
    text: 'Dr. Chen was amazing with my daughter. She was so nervous about her first filling but the team made her feel completely at ease.',
    date: daysAgo(0),
    sentiment: 'positive',
    response: null,
  },
  {
    id: 'r4',
    business_id: 'b2',
    business_name: 'Coastal Dental Care',
    author: 'Robert K.',
    rating: 2,
    text: 'Had to wait 30 minutes past my appointment time. Front desk was apologetic but it messed up my whole morning schedule.',
    date: daysAgo(2),
    sentiment: 'negative',
    response: null,
  },
  {
    id: 'r5',
    business_id: 'b1',
    business_name: 'Sunset Cafe & Bakery',
    author: 'Anna W.',
    rating: 3,
    text: 'The food is good but the prices have gone up recently. Still a nice spot but not the bargain it used to be.',
    date: daysAgo(3),
    sentiment: 'neutral',
    response: null,
  },
  {
    id: 'r6',
    business_id: 'b1',
    business_name: 'Sunset Cafe & Bakery',
    author: 'David L.',
    rating: 5,
    text: 'Their avocado toast is literally the best thing on their menu. Came here with friends and everyone loved their meals.',
    date: daysAgo(0),
    sentiment: 'positive',
    response: null,
  },
  {
    id: 'r7',
    business_id: 'b2',
    business_name: 'Coastal Dental Care',
    author: 'Sarah M.',
    rating: 4,
    text: 'Clean office, friendly staff. The hygienist did a thorough cleaning. Booking appointments online would be a nice addition.',
    date: daysAgo(4),
    sentiment: 'positive',
    response: null,
  },
  {
    id: 'r8',
    business_id: 'b1',
    business_name: 'Sunset Cafe & Bakery',
    author: 'Mike R.',
    rating: 1,
    text: 'Ordered delivery and it arrived cold and missing items. Called to complain and got attitude from the manager. Never again.',
    date: daysAgo(5),
    sentiment: 'negative',
    response: null,
  },
]

export function getDashboardStats(): DashboardStats {
  const today = new Date(Date.UTC(2026, 4, 30, 12, 0, 0, 0))

  const reviewsToday = MOCK_REVIEWS.filter(
    (r) => r.date.getTime() >= today.getTime()
  )

  const respondedReviews = MOCK_REVIEWS.filter((r) => r.response)
  const totalReviews = MOCK_REVIEWS.length
  const responseRate = totalReviews > 0 ? (respondedReviews.length / totalReviews) * 100 : 0

  const avgRating =
    totalReviews > 0
      ? MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

  return {
    reviewsToday: reviewsToday.length,
    responseRate: Math.round(responseRate),
    avgRating: Math.round(avgRating * 10) / 10,
    locationsCount: MOCK_BUSINESSES.length,
    totalReviews,
    recentReviews: MOCK_REVIEWS.slice(0, 5),
  }
}

export function getMockBusinesses() {
  return MOCK_BUSINESSES
}

export function getMockReviews(businessId?: string): ReviewData[] {
  if (businessId) {
    return MOCK_REVIEWS.filter((r) => r.business_id === businessId)
  }
  return MOCK_REVIEWS
}
