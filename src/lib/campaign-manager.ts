/**
 * Review Request Campaign Manager
 * Handles deduplication, cooldown periods, rate limiting per tier,
 * recipient validation, frequency capping, and campaign dispatch.
 */

export interface CampaignRecipient {
  id?: string
  email: string
  name?: string
  phone?: string
  lastContactedAt?: Date | string | null
  optedOut?: boolean
  customFields?: Record<string, string>
}

export interface ReviewRequestCampaignConfig {
  campaignId: string
  businessId: string
  userId: string
  tier: 'free' | 'pro' | 'business'
  cooldownDays?: number // default: 30 days
  maxBurstPerMinute?: number
}

export interface CampaignBatchResult {
  total: number
  sent: number
  skippedCooldown: number
  skippedOptedOut: number
  skippedInvalid: number
  skippedRateLimit: number
  processedRecipients: {
    email: string
    status: 'sent' | 'skipped_cooldown' | 'skipped_opted_out' | 'skipped_invalid' | 'skipped_rate_limit'
    reason?: string
  }[]
}

const TIER_MONTHLY_LIMITS: Record<string, number> = {
  free: 50,
  pro: 25000,
  business: Infinity,
}

/**
 * Validates and normalizes recipient email.
 */
export function normalizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null
  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  if (!emailRegex.test(trimmed) || trimmed.length > 254) {
    return null
  }
  return trimmed
}

/**
 * Checks if a recipient is within the cooldown window since last review request.
 */
export function isRecipientInCooldown(
  lastContactedAt: Date | string | null | undefined,
  cooldownDays = 30
): boolean {
  if (!lastContactedAt) return false
  const lastTime = new Date(lastContactedAt).getTime()
  if (isNaN(lastTime)) return false

  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000
  return Date.now() - lastTime < cooldownMs
}

/**
 * Deduplicates recipient list by email address (keeping the first occurrence).
 */
export function deduplicateRecipients(recipients: CampaignRecipient[]): CampaignRecipient[] {
  if (!recipients || !Array.isArray(recipients)) return []
  const seen = new Set<string>()
  const result: CampaignRecipient[] = []

  for (const r of recipients) {
    const normalized = normalizeEmail(r.email)
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      result.push({ ...r, email: normalized })
    }
  }

  return result
}

/**
 * Validates and executes campaign dispatch with rate limiting, cooldown, and deduplication.
 */
export function processCampaignRecipients(
  recipients: CampaignRecipient[],
  config: ReviewRequestCampaignConfig,
  currentMonthlyUsage = 0,
  suppressedEmails: Set<string> = new Set()
): CampaignBatchResult {
  const cooldownDays = config.cooldownDays ?? 30
  const tierLimit = TIER_MONTHLY_LIMITS[config.tier] || 50
  const remainingQuota = Math.max(0, tierLimit - currentMonthlyUsage)

  const deduped = deduplicateRecipients(recipients)
  let allowedToSend = remainingQuota

  const result: CampaignBatchResult = {
    total: recipients.length,
    sent: 0,
    skippedCooldown: 0,
    skippedOptedOut: 0,
    skippedInvalid: 0,
    skippedRateLimit: 0,
    processedRecipients: [],
  }

  // Check invalid original entries
  for (const original of recipients) {
    const normalized = normalizeEmail(original.email)
    if (!normalized) {
      result.skippedInvalid++
      result.processedRecipients.push({
        email: original.email || 'unknown',
        status: 'skipped_invalid',
        reason: 'Invalid email syntax',
      })
    }
  }

  for (const recipient of deduped) {
    const email = recipient.email

    // Check opt-out
    if (recipient.optedOut || suppressedEmails.has(email)) {
      result.skippedOptedOut++
      result.processedRecipients.push({
        email,
        status: 'skipped_opted_out',
        reason: 'Recipient has opted out of communications',
      })
      continue
    }

    // Check cooldown window
    if (isRecipientInCooldown(recipient.lastContactedAt, cooldownDays)) {
      result.skippedCooldown++
      result.processedRecipients.push({
        email,
        status: 'skipped_cooldown',
        reason: `Contacted within the last ${cooldownDays} days`,
      })
      continue
    }

    // Check plan tier rate limits
    if (allowedToSend <= 0) {
      result.skippedRateLimit++
      result.processedRecipients.push({
        email,
        status: 'skipped_rate_limit',
        reason: `Monthly limit of ${tierLimit} requests reached for plan '${config.tier}'`,
      })
      continue
    }

    // Recipient passes all checks
    result.sent++
    allowedToSend--
    result.processedRecipients.push({
      email,
      status: 'sent',
    })
  }

  return result
}
