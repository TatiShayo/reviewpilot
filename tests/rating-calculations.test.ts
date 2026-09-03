import { describe, it, expect } from 'vitest'
import {
  calculateAverageRating,
  calculateWeightedAverage,
  calculateRatingDistribution,
  calculateNPS,
  analyzeReviewVelocity,
} from '@/lib/rating-calculations'

describe('Rating Calculations & NPS Suite', () => {
  describe('calculateAverageRating', () => {
    it('calculates exact average and rounded value for standard reviews', () => {
      const reviews = [{ rating: 5 }, { rating: 4 }, { rating: 4 }, { rating: 5 }, { rating: 3 }]
      const result = calculateAverageRating(reviews)
      expect(result.total).toBe(5)
      expect(result.average).toBe(4.2)
      expect(result.rounded).toBe(4.2)
    })

    it('handles empty review arrays gracefully without division by zero', () => {
      const result = calculateAverageRating([])
      expect(result.total).toBe(0)
      expect(result.average).toBe(0)
      expect(result.rounded).toBe(0)
    })

    it('handles null, undefined, or malformed review objects', () => {
      // @ts-expect-error testing runtime resistance
      const result = calculateAverageRating([null, undefined, { rating: 'not-a-number' }, { rating: 5 }])
      expect(result.total).toBe(1)
      expect(result.average).toBe(5)
    })

    it('clamps ratings between 0 and 5', () => {
      const reviews = [{ rating: 5 }, { rating: 5 }, { rating: 5 }]
      const result = calculateAverageRating(reviews)
      expect(result.average).toBe(5.0)
      expect(result.rounded).toBe(5.0)
    })

    it('respects decimal places parameter', () => {
      const reviews = [{ rating: 5 }, { rating: 4 }, { rating: 4 }] // avg = 4.33333...
      const resultOneDec = calculateAverageRating(reviews, 1)
      const resultTwoDec = calculateAverageRating(reviews, 2)
      expect(resultOneDec.rounded).toBe(4.3)
      expect(resultTwoDec.rounded).toBe(4.33)
    })

    it('correctly handles all 1-star reviews', () => {
      const reviews = [{ rating: 1 }, { rating: 1 }, { rating: 1 }]
      const result = calculateAverageRating(reviews)
      expect(result.average).toBe(1.0)
      expect(result.rounded).toBe(1.0)
      expect(result.total).toBe(3)
    })
  })

  describe('calculateWeightedAverage', () => {
    it('computes weighted average when weights are specified', () => {
      const reviews = [
        { rating: 5, weight: 3 }, // heavy weight
        { rating: 1, weight: 1 }, // light weight
      ]
      // (5*3 + 1*1) / (3 + 1) = 16 / 4 = 4.0
      const result = calculateWeightedAverage(reviews)
      expect(result).toBe(4.0)
    })

    it('defaults weight to 1 if weight is missing or non-positive', () => {
      const reviews = [
        { rating: 4, weight: 0 }, // fallback to 1
        { rating: 2 }, // fallback to 1
      ]
      // (4*1 + 2*1) / 2 = 3.0
      const result = calculateWeightedAverage(reviews)
      expect(result).toBe(3.0)
    })

    it('returns 0 for empty array', () => {
      expect(calculateWeightedAverage([])).toBe(0)
    })
  })

  describe('calculateRatingDistribution', () => {
    it('calculates correct counts and percentages across 1 to 5 stars', () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 1 },
      ]
      const dist = calculateRatingDistribution(reviews)

      expect(dist[5].count).toBe(2)
      expect(dist[5].percentage).toBe(40.0)

      expect(dist[4].count).toBe(1)
      expect(dist[4].percentage).toBe(20.0)

      expect(dist[3].count).toBe(1)
      expect(dist[3].percentage).toBe(20.0)

      expect(dist[2].count).toBe(0)
      expect(dist[2].percentage).toBe(0.0)

      expect(dist[1].count).toBe(1)
      expect(dist[1].percentage).toBe(20.0)
    })

    it('returns zero distribution for empty array', () => {
      const dist = calculateRatingDistribution([])
      for (let s = 1; s <= 5; s++) {
        // @ts-expect-error index
        expect(dist[s].count).toBe(0)
        // @ts-expect-error index
        expect(dist[s].percentage).toBe(0)
      }
    })

    it('handles 100% 5-star distribution', () => {
      const reviews = [{ rating: 5 }, { rating: 5 }, { rating: 5 }]
      const dist = calculateRatingDistribution(reviews)
      expect(dist[5].count).toBe(3)
      expect(dist[5].percentage).toBe(100.0)
      expect(dist[1].count).toBe(0)
      expect(dist[1].percentage).toBe(0)
    })
  })

  describe('calculateNPS (Net Promoter Score)', () => {
    it('calculates NPS correctly on standard 1-5 scale for mixed reviews', () => {
      // 5 reviews: 3 Promoters (5-star), 1 Passive (4-star), 1 Detractor (1-star)
      // % Promoters = 60%, % Detractors = 20% -> NPS = +40
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 1 },
      ]
      const result = calculateNPS(reviews, '1-5')
      expect(result.total).toBe(5)
      expect(result.promoters).toBe(3)
      expect(result.passives).toBe(1)
      expect(result.detractors).toBe(1)
      expect(result.promoterPercentage).toBe(60.0)
      expect(result.passivePercentage).toBe(20.0)
      expect(result.detractorPercentage).toBe(20.0)
      expect(result.nps).toBe(40)
      expect(result.classification).toBe('Good')
    })

    it('returns +100 NPS for all 5-star promoters', () => {
      const reviews = [{ rating: 5 }, { rating: 5 }, { rating: 5 }]
      const result = calculateNPS(reviews)
      expect(result.nps).toBe(100)
      expect(result.classification).toBe('Excellent')
    })

    it('returns -100 NPS for all detractors', () => {
      const reviews = [{ rating: 1 }, { rating: 2 }, { rating: 3 }]
      const result = calculateNPS(reviews)
      expect(result.nps).toBe(-100)
      expect(result.classification).toBe('Critical')
    })

    it('calculates NPS correctly on 0-10 scale', () => {
      // 10-point scale: 9-10 (Promoter), 7-8 (Passive), 0-6 (Detractor)
      const reviews = [
        { rating: 10 }, // Promoter
        { rating: 9 },  // Promoter
        { rating: 8 },  // Passive
        { rating: 5 },  // Detractor
      ]
      const result = calculateNPS(reviews, '0-10')
      expect(result.total).toBe(4)
      expect(result.promoters).toBe(2) // 50%
      expect(result.passives).toBe(1)  // 25%
      expect(result.detractors).toBe(1) // 25%
      expect(result.nps).toBe(25)
      expect(result.classification).toBe('Good')
    })

    it('returns 0 NPS and graceful state for empty list', () => {
      const result = calculateNPS([])
      expect(result.total).toBe(0)
      expect(result.nps).toBe(0)
      expect(result.promoters).toBe(0)
      expect(result.detractors).toBe(0)
    })
  })

  describe('analyzeReviewVelocity', () => {
    it('detects sudden review volume drop (>50% drop from previous period)', () => {
      const periods = [
        { week: 'Week 1', count: 20, ratings: [5, 4, 5] },
        { week: 'Week 2', count: 8, ratings: [4, 4] }, // drop: 8 < 10 (20 * 0.5) -> drop of 60%
      ]
      const analysis = analyzeReviewVelocity(periods)
      expect(analysis.isDrop).toBe(true)
      expect(analysis.dropPercentage).toBe(60)
      expect(analysis.trend).toBe('down')
    })

    it('detects upward review volume trend', () => {
      const periods = [
        { week: 'Week 1', count: 10, ratings: [4, 5] },
        { week: 'Week 2', count: 18, ratings: [5, 5, 5] },
      ]
      const analysis = analyzeReviewVelocity(periods)
      expect(analysis.isDrop).toBe(false)
      expect(analysis.trend).toBe('up')
    })

    it('handles empty or single period gracefully', () => {
      const analysis = analyzeReviewVelocity([])
      expect(analysis.periods.length).toBe(0)
      expect(analysis.isDrop).toBe(false)
      expect(analysis.trend).toBe('flat')
    })
  })
})
