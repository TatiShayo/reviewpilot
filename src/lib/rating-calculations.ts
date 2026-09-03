/**
 * Rating & NPS Calculations Module for ReviewPilot
 * Handles average star rating, star distribution percentages, weighted averages,
 * Net Promoter Score (NPS) calculations, and review velocity trends.
 */

export interface ReviewRatingItem {
  rating: number
  weight?: number
  date?: Date | string
}

export interface RatingSummary {
  average: number
  total: number
  rounded: number
}

export interface StarDistribution {
  count: number
  percentage: number
}

export type RatingDistributionMap = Record<1 | 2 | 3 | 4 | 5, StarDistribution>

export interface NPSResult {
  nps: number
  promoters: number
  passives: number
  detractors: number
  promoterPercentage: number
  passivePercentage: number
  detractorPercentage: number
  total: number
  classification: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical'
}

export interface VelocityPeriod {
  period: string
  count: number
  averageRating: number
}

export interface VelocityAnalysis {
  periods: VelocityPeriod[]
  isDrop: boolean
  dropPercentage: number
  trend: 'up' | 'down' | 'flat'
}

/**
 * Calculates the arithmetic average rating from a list of reviews.
 * Clamps result between 0 and 5. Gracefully handles empty or invalid inputs.
 */
export function calculateAverageRating(
  reviews: ReviewRatingItem[],
  decimals = 1
): RatingSummary {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return { average: 0, total: 0, rounded: 0 }
  }

  const valid = reviews.filter(
    (r) => typeof r?.rating === 'number' && !isNaN(r.rating) && r.rating >= 0 && r.rating <= 5
  )

  if (valid.length === 0) {
    return { average: 0, total: 0, rounded: 0 }
  }

  const sum = valid.reduce((acc, curr) => acc + curr.rating, 0)
  const average = sum / valid.length
  const multiplier = Math.pow(10, decimals)
  const rounded = Math.round(average * multiplier) / multiplier

  return {
    average: Math.min(5, Math.max(0, average)),
    total: valid.length,
    rounded: Math.min(5, Math.max(0, rounded)),
  }
}

/**
 * Calculates weighted average rating based on optional review weights or recency.
 */
export function calculateWeightedAverage(
  reviews: ReviewRatingItem[],
  decimals = 2
): number {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return 0
  }

  let totalWeight = 0
  let weightedSum = 0

  for (const item of reviews) {
    if (typeof item?.rating !== 'number' || isNaN(item.rating)) continue
    const clampedRating = Math.min(5, Math.max(0, item.rating))
    const weight = typeof item.weight === 'number' && item.weight > 0 ? item.weight : 1

    weightedSum += clampedRating * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return 0

  const avg = weightedSum / totalWeight
  const factor = Math.pow(10, decimals)
  return Math.round(avg * factor) / factor
}

/**
 * Calculates star distribution breakdown (1-star through 5-star counts and integer/float percentages).
 */
export function calculateRatingDistribution(
  reviews: ReviewRatingItem[]
): RatingDistributionMap {
  const distribution: RatingDistributionMap = {
    1: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    5: { count: 0, percentage: 0 },
  }

  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return distribution
  }

  let validCount = 0

  for (const item of reviews) {
    if (typeof item?.rating !== 'number' || isNaN(item.rating)) continue
    const star = Math.round(item.rating) as 1 | 2 | 3 | 4 | 5
    if (star >= 1 && star <= 5) {
      distribution[star].count += 1
      validCount += 1
    }
  }

  if (validCount > 0) {
    for (let s = 1; s <= 5; s++) {
      const star = s as 1 | 2 | 3 | 4 | 5
      const pct = (distribution[star].count / validCount) * 100
      distribution[star].percentage = Math.round(pct * 10) / 10
    }
  }

  return distribution
}

/**
 * Calculates Net Promoter Score (NPS) from reviews.
 * Standard 5-star conversion:
 * - 5 Stars = Promoters
 * - 4 Stars = Passives
 * - 1-3 Stars = Detractors
 * 
 * Or 0-10 Scale:
 * - 9-10 = Promoters
 * - 7-8 = Passives
 * - 0-6 = Detractors
 */
export function calculateNPS(
  reviews: ReviewRatingItem[],
  scale: '1-5' | '0-10' = '1-5'
): NPSResult {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return {
      nps: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      promoterPercentage: 0,
      passivePercentage: 0,
      detractorPercentage: 0,
      total: 0,
      classification: 'Needs Improvement',
    }
  }

  let promoters = 0
  let passives = 0
  let detractors = 0
  let validTotal = 0

  for (const r of reviews) {
    if (typeof r?.rating !== 'number' || isNaN(r.rating)) continue
    const val = r.rating

    if (scale === '1-5') {
      if (val >= 4.5) {
        promoters++
      } else if (val >= 3.5) {
        passives++
      } else if (val >= 1) {
        detractors++
      } else {
        continue
      }
      validTotal++
    } else {
      // 0-10 scale
      if (val >= 9 && val <= 10) {
        promoters++
      } else if (val >= 7 && val < 9) {
        passives++
      } else if (val >= 0 && val < 7) {
        detractors++
      } else {
        continue
      }
      validTotal++
    }
  }

  if (validTotal === 0) {
    return {
      nps: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      promoterPercentage: 0,
      passivePercentage: 0,
      detractorPercentage: 0,
      total: 0,
      classification: 'Needs Improvement',
    }
  }

  const promoterPct = (promoters / validTotal) * 100
  const passivePct = (passives / validTotal) * 100
  const detractorPct = (detractors / validTotal) * 100
  const rawNps = promoterPct - detractorPct
  const nps = Math.round(rawNps)

  let classification: NPSResult['classification'] = 'Needs Improvement'
  if (nps >= 50) {
    classification = 'Excellent'
  } else if (nps >= 20) {
    classification = 'Good'
  } else if (nps >= 0) {
    classification = 'Needs Improvement'
  } else {
    classification = 'Critical'
  }

  return {
    nps: Math.max(-100, Math.min(100, nps)),
    promoters,
    passives,
    detractors,
    promoterPercentage: Math.round(promoterPct * 10) / 10,
    passivePercentage: Math.round(passivePct * 10) / 10,
    detractorPercentage: Math.round(detractorPct * 10) / 10,
    total: validTotal,
    classification,
  }
}

/**
 * Computes weekly/periodic review velocity and alerts if review inflow drops drastically.
 */
export function analyzeReviewVelocity(
  periods: { week: string; count: number; ratings?: number[] }[]
): VelocityAnalysis {
  if (!periods || periods.length === 0) {
    return { periods: [], isDrop: false, dropPercentage: 0, trend: 'flat' }
  }

  const formatted: VelocityPeriod[] = periods.map((p) => {
    const ratings = p.ratings || []
    const avg =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0
    return {
      period: p.week,
      count: p.count,
      averageRating: avg,
    }
  })

  if (formatted.length < 2) {
    return {
      periods: formatted,
      isDrop: false,
      dropPercentage: 0,
      trend: 'flat',
    }
  }

  const lastPeriod = formatted[formatted.length - 1]
  const prevPeriod = formatted[formatted.length - 2]

  let isDrop = false
  let dropPercentage = 0

  if (prevPeriod.count > 0) {
    if (lastPeriod.count < prevPeriod.count * 0.5) {
      isDrop = true
      dropPercentage = Math.round(((prevPeriod.count - lastPeriod.count) / prevPeriod.count) * 100)
    }
  }

  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (lastPeriod.count > prevPeriod.count) {
    trend = 'up'
  } else if (lastPeriod.count < prevPeriod.count) {
    trend = 'down'
  }

  return {
    periods: formatted,
    isDrop,
    dropPercentage,
    trend,
  }
}
