import crypto from 'crypto'
import { normalizeEmail } from './campaign-manager'

export interface UnsubscribeTokenPayload {
  email: string
  tenantId: string
  type: 'digest' | 'campaign' | 'all'
  timestamp: number
  expiresAt: number
}

/**
 * Unsubscribe-token signing secret.
 *
 * Fails closed: a known default lets anyone mint a valid unsubscribe token for
 * any address, suppressing recipients from a list.
 */
function getUnsubscribeSecret(customSecret?: string): string {
  if (customSecret) return customSecret;
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "UNSUBSCRIBE_SECRET must be set in production — unsubscribe tokens would otherwise be forgeable"
    );
  }
  return "dev-only-unsubscribe-secret";
}

// In-memory suppression list for tests and fast server checks
const suppressionStore = new Map<string, Set<string>>() // tenantId -> Set<normalizedEmail>

/**
 * Generates an HMAC-signed unsubscribe token.
 */
export function generateUnsubscribeToken(
  email: string,
  tenantId: string,
  type: 'digest' | 'campaign' | 'all' = 'all',
  expiresInDays = 90,
  secret?: string
): string {
  const activeSecret = getUnsubscribeSecret(secret)
  const normalized = normalizeEmail(email) || email.trim().toLowerCase()
  const now = Date.now()
  const payload: UnsubscribeTokenPayload = {
    email: normalized,
    tenantId,
    type,
    timestamp: now,
    expiresAt: now + expiresInDays * 24 * 60 * 60 * 1000,
  }

  const encodedData = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', activeSecret)
    .update(encodedData)
    .digest('base64url')

  return `${encodedData}.${signature}`
}

/**
 * Verifies an HMAC-signed unsubscribe token.
 */
export function verifyUnsubscribeToken(
  token: string,
  secret?: string
): { valid: boolean; payload?: UnsubscribeTokenPayload; error?: string } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false, error: 'Malformed or missing unsubscribe token' }
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token structure' }
  }

  const [encodedData, signature] = parts
  const activeSecret = getUnsubscribeSecret(secret)

  const expectedSignature = crypto
    .createHmac('sha256', activeSecret)
    .update(encodedData)
    .digest('base64url')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Invalid token signature or tampering detected' }
  }

  let payload: UnsubscribeTokenPayload
  try {
    const jsonStr = Buffer.from(encodedData, 'base64url').toString('utf8')
    payload = JSON.parse(jsonStr)
  } catch {
    return { valid: false, error: 'Failed to decode token payload' }
  }

  if (typeof payload.expiresAt === 'number' && Date.now() > payload.expiresAt) {
    return { valid: false, error: 'Unsubscribe token has expired' }
  }

  return { valid: true, payload }
}

/**
 * Records an email opt-out for a tenant.
 */
export function recordOptOut(tenantId: string, email: string): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  if (!suppressionStore.has(tenantId)) {
    suppressionStore.set(tenantId, new Set())
  }
  suppressionStore.get(tenantId)!.add(normalized)
  return true
}

/**
 * Checks if an email is opted-out for a given tenant.
 */
export function isOptedOut(tenantId: string, email: string): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized) return true // Treat invalid as suppressed
  const tenantSet = suppressionStore.get(tenantId)
  if (!tenantSet) return false
  return tenantSet.has(normalized)
}

/**
 * Removes an opt-out (resubscribe).
 */
export function removeOptOut(tenantId: string, email: string): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized) return false
  const tenantSet = suppressionStore.get(tenantId)
  if (!tenantSet) return false
  return tenantSet.delete(normalized)
}

/**
 * Generates an RFC 8058 compliant one-click unsubscribe URL.
 */
export function generateUnsubscribeUrl(
  baseUrl: string,
  email: string,
  tenantId: string,
  type: 'digest' | 'campaign' | 'all' = 'all',
  secret?: string
): string {
  const token = generateUnsubscribeToken(email, tenantId, type, 90, secret)
  const cleanBase = baseUrl.replace(/\/+$/, '')
  return `${cleanBase}/unsubscribe?token=${encodeURIComponent(token)}`
}
