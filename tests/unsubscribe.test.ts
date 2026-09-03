import { describe, it, expect } from 'vitest'
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  recordOptOut,
  isOptedOut,
  removeOptOut,
  generateUnsubscribeUrl,
} from '@/lib/unsubscribe'

describe('Unsubscribe & Opt-Out Security Suite', () => {
  const secretKey = 'test_unsubscribe_secret_key_512bits_cryptographic'

  describe('HMAC Token Generation and Verification', () => {
    it('generates and verifies a valid HMAC unsubscribe token', () => {
      const email = 'subscriber@example.com'
      const tenantId = 'tenant-123'
      const token = generateUnsubscribeToken(email, tenantId, 'digest', 90, secretKey)

      expect(typeof token).toBe('string')
      expect(token).toContain('.')

      const verification = verifyUnsubscribeToken(token, secretKey)
      expect(verification.valid).toBe(true)
      expect(verification.payload?.email).toBe(email)
      expect(verification.payload?.tenantId).toBe(tenantId)
      expect(verification.payload?.type).toBe('digest')
    })

    it('rejects tampered tokens', () => {
      const token = generateUnsubscribeToken('user@test.com', 'tenant-1', 'all', 30, secretKey)
      const [encodedData] = token.split('.')
      const tamperedToken = `${encodedData}.forgedSignature9999`

      const verification = verifyUnsubscribeToken(tamperedToken, secretKey)
      expect(verification.valid).toBe(false)
      expect(verification.error).toContain('tampering detected')
    })

    it('rejects expired unsubscribe tokens', () => {
      const expiredToken = generateUnsubscribeToken('user@test.com', 'tenant-1', 'all', -1, secretKey)
      const verification = verifyUnsubscribeToken(expiredToken, secretKey)
      expect(verification.valid).toBe(false)
      expect(verification.error).toContain('expired')
    })

    it('rejects malformed token strings', () => {
      expect(verifyUnsubscribeToken('', secretKey).valid).toBe(false)
      expect(verifyUnsubscribeToken('no_dot_here', secretKey).valid).toBe(false)
    })
  })

  describe('Opt-Out Suppression Store', () => {
    it('records and checks recipient opt-out for specific tenants', () => {
      const tenantA = 'tenant-alpha'
      const tenantB = 'tenant-beta'
      const email = 'user@domain.com'

      expect(isOptedOut(tenantA, email)).toBe(false)

      recordOptOut(tenantA, email)

      expect(isOptedOut(tenantA, email)).toBe(true)
      // Multi-tenant isolation: Tenant B should not have Tenant A's opt-out
      expect(isOptedOut(tenantB, email)).toBe(false)
    })

    it('handles email case-insensitivity in opt-out registry', () => {
      const tenant = 'tenant-gamma'
      recordOptOut(tenant, 'Customer@Example.Com')
      expect(isOptedOut(tenant, 'customer@example.com')).toBe(true)
    })

    it('allows resubscribing via removeOptOut', () => {
      const tenant = 'tenant-delta'
      const email = 'resub@example.com'

      recordOptOut(tenant, email)
      expect(isOptedOut(tenant, email)).toBe(true)

      const removed = removeOptOut(tenant, email)
      expect(removed).toBe(true)
      expect(isOptedOut(tenant, email)).toBe(false)
    })
  })

  describe('generateUnsubscribeUrl', () => {
    it('creates an RFC-compliant unsubscribe URL', () => {
      const url = generateUnsubscribeUrl(
        'https://app.reviewpilot.com',
        'user@example.com',
        'tenant-99',
        'all',
        secretKey
      )

      expect(url).toContain('https://app.reviewpilot.com/unsubscribe?token=')
      const parsedUrl = new URL(url)
      const token = parsedUrl.searchParams.get('token')
      expect(token).toBeTruthy()

      const verification = verifyUnsubscribeToken(token!, secretKey)
      expect(verification.valid).toBe(true)
      expect(verification.payload?.email).toBe('user@example.com')
    })
  })
})
