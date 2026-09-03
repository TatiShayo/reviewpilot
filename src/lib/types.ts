export interface ReviewData {
  id: string
  business_id: string
  business_name: string
  author: string
  rating: number
  text: string
  date: Date | string
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

export interface Competitor {
  id: string
  user_id: string
  business_id: string | null
  name: string
  gmb_handle: string | null
  platform: string
  rating: number
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface CompetitorSnapshot {
  id: string
  competitor_id: string
  rating: number
  total_reviews: number
  snapshot_date: string
}

export interface CompetitorRatingData {
  name: string
  rating: number
  date: string
}

export type {
  ReviewRatingItem,
  RatingSummary,
  StarDistribution,
  RatingDistributionMap,
  NPSResult,
  VelocityPeriod,
  VelocityAnalysis,
} from './rating-calculations'

export type {
  SentimentClassificationResult,
} from './sentiment'

export type {
  EmbedTokenPayload,
} from './embed-token'

export type {
  WidgetConfig,
} from './widget-config'

export type {
  CampaignRecipient,
  ReviewRequestCampaignConfig,
  CampaignBatchResult,
} from './campaign-manager'

export type {
  UnsubscribeTokenPayload,
} from './unsubscribe'

export type {
  TenantRole,
} from './tenant-isolation'
