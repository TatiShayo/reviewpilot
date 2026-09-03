import { describe, it, expect } from 'vitest'
import {
  normalizeEmail,
  isRecipientInCooldown,
  deduplicateRecipients,
  processCampaignRecipients,
  type CampaignRecipient,
  type ReviewRequestCampaignConfig,
} from '@/lib/campaign-manager'

describe('Review Request Campaign Manager Suite', () => {
  describe('normalizeEmail', () => {
    it('normalizes valid emails by trimming and converting to lowercase', () => {
      expect(normalizeEmail('  John.Doe@Example.COM ')).toBe('john.doe@example.com')
      expect(normalizeEmail('user+tag@domain.co.uk')).toBe('user+tag@domain.co.uk')
    })

    it('rejects invalid email formats', () => {
      expect(normalizeEmail('')).toBeNull()
      expect(normalizeEmail('plainaddress')).toBeNull()
      expect(normalizeEmail('missing@domain')).toBeNull()
      expect(normalizeEmail('@missingusername.com')).toBeNull()
      // @ts-expect-error test non-string
      expect(normalizeEmail(null)).toBeNull()
    })
  })

  describe('isRecipientInCooldown', () => {
    it('returns true if recipient was contacted within the cooldown window', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      expect(isRecipientInCooldown(fiveDaysAgo, 30)).toBe(true)
    })

    it('returns false if recipient was contacted outside the cooldown window', () => {
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      expect(isRecipientInCooldown(fortyDaysAgo, 30)).toBe(false)
    })

    it('returns false if recipient has never been contacted (null/undefined)', () => {
      expect(isRecipientInCooldown(null, 30)).toBe(false)
      expect(isRecipientInCooldown(undefined, 30)).toBe(false)
    })

    it('handles invalid date strings without crashing', () => {
      expect(isRecipientInCooldown('not-a-valid-date', 30)).toBe(false)
    })
  })

  describe('deduplicateRecipients', () => {
    it('removes duplicate email entries while preserving order', () => {
      const input: CampaignRecipient[] = [
        { email: 'alice@example.com', name: 'Alice 1' },
        { email: 'BOB@example.com', name: 'Bob' },
        { email: 'Alice@Example.com', name: 'Alice Duplicate' },
        { email: 'bob@example.com', name: 'Bob Duplicate' },
        { email: 'charlie@example.com', name: 'Charlie' },
      ]

      const deduped = deduplicateRecipients(input)
      expect(deduped.length).toBe(3)
      expect(deduped.map((r) => r.email)).toEqual([
        'alice@example.com',
        'bob@example.com',
        'charlie@example.com',
      ])
    })

    it('handles empty or malformed arrays gracefully', () => {
      expect(deduplicateRecipients([])).toEqual([])
      // @ts-expect-error non-array
      expect(deduplicateRecipients(null)).toEqual([])
    })
  })

  describe('processCampaignRecipients (Batch Processing & Rate Limiting)', () => {
    const baseConfig: ReviewRequestCampaignConfig = {
      campaignId: 'camp-1',
      businessId: 'biz-1',
      userId: 'user-1',
      tier: 'free',
      cooldownDays: 30,
    }

    it('allows sending when within plan tier limits and not in cooldown', () => {
      const recipients: CampaignRecipient[] = [
        { email: 'client1@test.com', name: 'Client 1' },
        { email: 'client2@test.com', name: 'Client 2' },
      ]

      const result = processCampaignRecipients(recipients, baseConfig, 10)
      expect(result.sent).toBe(2)
      expect(result.skippedRateLimit).toBe(0)
      expect(result.skippedCooldown).toBe(0)
      expect(result.skippedOptedOut).toBe(0)
    })

    it('enforces monthly plan quota for Free tier (50 limit)', () => {
      const recipients: CampaignRecipient[] = [
        { email: 'client1@test.com' },
        { email: 'client2@test.com' },
        { email: 'client3@test.com' },
      ]

      // Current usage = 49 (only 1 remaining on free plan)
      const result = processCampaignRecipients(recipients, baseConfig, 49)
      expect(result.sent).toBe(1)
      expect(result.skippedRateLimit).toBe(2)
    })

    it('skips recipients who are in the 30-day cooldown window', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const recipients: CampaignRecipient[] = [
        { email: 'recent@test.com', lastContactedAt: tenDaysAgo },
        { email: 'fresh@test.com', lastContactedAt: null },
      ]

      const result = processCampaignRecipients(recipients, baseConfig, 0)
      expect(result.sent).toBe(1)
      expect(result.skippedCooldown).toBe(1)
      expect(result.processedRecipients.find((r) => r.email === 'recent@test.com')?.status).toBe(
        'skipped_cooldown'
      )
    })

    it('skips recipients who have opted out or are on the suppression list', () => {
      const recipients: CampaignRecipient[] = [
        { email: 'optout1@test.com', optedOut: true },
        { email: 'suppressed@test.com' },
        { email: 'active@test.com' },
      ]

      const suppressionList = new Set(['suppressed@test.com'])
      const result = processCampaignRecipients(recipients, baseConfig, 0, suppressionList)

      expect(result.sent).toBe(1)
      expect(result.skippedOptedOut).toBe(2)
    })

    it('handles invalid email addresses gracefully', () => {
      const recipients: CampaignRecipient[] = [
        { email: 'not-an-email' },
        { email: 'valid@example.com' },
      ]

      const result = processCampaignRecipients(recipients, baseConfig, 0)
      expect(result.sent).toBe(1)
      expect(result.skippedInvalid).toBe(1)
    })

    it('supports higher volume on Pro and Business tiers', () => {
      const proConfig: ReviewRequestCampaignConfig = {
        ...baseConfig,
        tier: 'pro',
      }
      const recipients: CampaignRecipient[] = Array.from({ length: 100 }, (_, i) => ({
        email: `customer${i}@example.com`,
      }))

      const result = processCampaignRecipients(recipients, proConfig, 1000)
      expect(result.sent).toBe(100)
      expect(result.skippedRateLimit).toBe(0)
    })
  })
})
