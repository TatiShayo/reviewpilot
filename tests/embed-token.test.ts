import { describe, it, expect } from 'vitest'
import {
  generateWidgetEmbedToken,
  verifyWidgetEmbedToken,
  isOriginAllowed,
  getWidgetSecurityHeaders,
} from '@/lib/embed-token'
import {
  sanitizeWidgetInput,
  generateWidgetThemeStyles,
  widgetConfigSchema,
} from '@/lib/widget-config'

describe('Widget Embed Token & CORS Security Suite', () => {
  const testSecret = 'unit_test_embed_secret_key_384_bits_secure'

  describe('generateWidgetEmbedToken & verifyWidgetEmbedToken', () => {
    it('generates and verifies a valid signed embed token', () => {
      const token = generateWidgetEmbedToken(
        {
          businessId: 'biz-123',
          tenantId: 'user-456',
          allowedDomains: ['example.com', '*.example.com'],
          permissions: ['read', 'write'],
        },
        testSecret
      )

      expect(typeof token).toBe('string')
      expect(token).toContain('.')

      const verification = verifyWidgetEmbedToken(token, 'https://example.com', testSecret)
      expect(verification.valid).toBe(true)
      expect(verification.payload?.businessId).toBe('biz-123')
      expect(verification.payload?.tenantId).toBe('user-456')
      expect(verification.payload?.permissions).toContain('write')
    })

    it('rejects tampered tokens with invalid signatures', () => {
      const token = generateWidgetEmbedToken(
        {
          businessId: 'biz-123',
          tenantId: 'user-456',
          allowedDomains: ['*'],
        },
        testSecret
      )

      const [data] = token.split('.')
      const tamperedToken = `${data}.invalidSignatureHere12345`

      const verification = verifyWidgetEmbedToken(tamperedToken, undefined, testSecret)
      expect(verification.valid).toBe(false)
      expect(verification.error).toContain('Invalid token signature')
    })

    it('rejects expired tokens', () => {
      const expiredToken = generateWidgetEmbedToken(
        {
          businessId: 'biz-123',
          tenantId: 'user-456',
          allowedDomains: ['*'],
          expiresInMs: -1000, // expired 1 sec ago
        },
        testSecret
      )

      const verification = verifyWidgetEmbedToken(expiredToken, undefined, testSecret)
      expect(verification.valid).toBe(false)
      expect(verification.error).toContain('expired')
    })

    it('rejects malformed or empty token strings', () => {
      expect(verifyWidgetEmbedToken('', undefined, testSecret).valid).toBe(false)
      expect(verifyWidgetEmbedToken('no-dot-token', undefined, testSecret).valid).toBe(false)
      expect(verifyWidgetEmbedToken('a.b.c.d', undefined, testSecret).valid).toBe(false)
    })
  })

  describe('isOriginAllowed (Domain & CORS Authorization)', () => {
    it('allows any origin when wildcard "*" is configured', () => {
      expect(isOriginAllowed('https://anydomain.com', ['*'])).toBe(true)
      expect(isOriginAllowed('http://localhost:3000', ['*'])).toBe(true)
    })

    it('allows exact domain matches', () => {
      const allowed = ['store.mybusiness.com', 'mybusiness.com']
      expect(isOriginAllowed('https://store.mybusiness.com', allowed)).toBe(true)
      expect(isOriginAllowed('https://mybusiness.com', allowed)).toBe(true)
      expect(isOriginAllowed('https://other.com', allowed)).toBe(false)
    })

    it('allows subdomain wildcards (*.domain.com)', () => {
      const allowed = ['*.shop.com']
      expect(isOriginAllowed('https://us.shop.com', allowed)).toBe(true)
      expect(isOriginAllowed('https://eu.shop.com', allowed)).toBe(true)
      expect(isOriginAllowed('https://shop.com', allowed)).toBe(true)
      // Must NOT match prefix attacks
      expect(isOriginAllowed('https://evil-shop.com', allowed)).toBe(false)
    })

    it('rejects null or undefined origins when not wildcard', () => {
      expect(isOriginAllowed(null, ['example.com'])).toBe(false)
      expect(isOriginAllowed(undefined, ['example.com'])).toBe(false)
    })
  })

  describe('getWidgetSecurityHeaders', () => {
    it('generates frame-ancestors and CORS headers for wildcard', () => {
      const headers = getWidgetSecurityHeaders(['*'])
      expect(headers['Access-Control-Allow-Origin']).toBe('*')
      expect(headers['Content-Security-Policy']).toContain('frame-ancestors *')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
    })

    it('generates strict frame-ancestors for specific domains', () => {
      const headers = getWidgetSecurityHeaders(['https://app.client.com'], 'https://app.client.com')
      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.client.com')
      expect(headers['Content-Security-Policy']).toContain('frame-ancestors')
      expect(headers['Content-Security-Policy']).toContain('https://app.client.com')
    })
  })

  describe('sanitizeWidgetInput (XSS Prevention)', () => {
    it('escapes HTML tags and script injection attempts', () => {
      const malicious = '<script>alert("xss")</script>'
      const sanitized = sanitizeWidgetInput(malicious)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })

    it('escapes img onerror payloads', () => {
      const payload = '<img src=x onerror=alert(1)>'
      const sanitized = sanitizeWidgetInput(payload)
      expect(sanitized).not.toContain('<img')
      expect(sanitized).toContain('&lt;img')
    })

    it('handles empty or non-string inputs safely', () => {
      // @ts-expect-error non-string
      expect(sanitizeWidgetInput(null)).toBe('')
      // @ts-expect-error non-string
      expect(sanitizeWidgetInput(undefined)).toBe('')
      expect(sanitizeWidgetInput('  Normal Review Text  ')).toBe('Normal Review Text')
    })
  })

  describe('Widget Theme & Configuration', () => {
    it('validates correct widget schema', () => {
      const valid = widgetConfigSchema.safeParse({
        theme: 'midnight',
        layout: 'carousel',
        primaryColor: '#3b82f6',
        borderRadius: 16,
      })
      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.theme).toBe('midnight')
        expect(valid.data.showStars).toBe(true) // default
      }
    })

    it('rejects invalid hex colors in widget schema', () => {
      const invalid = widgetConfigSchema.safeParse({
        primaryColor: 'not-a-hex-color',
      })
      expect(invalid.success).toBe(false)
    })

    it('generates CSS variables for dark and custom themes', () => {
      const darkVars = generateWidgetThemeStyles({ theme: 'dark', primaryColor: '#f97316' })
      expect(darkVars['--rp-bg']).toBe('#18181b')
      expect(darkVars['--rp-primary']).toBe('#f97316')

      const customVars = generateWidgetThemeStyles({
        theme: 'custom',
        backgroundColor: '#112233',
        textColor: '#ffffff',
      })
      expect(customVars['--rp-bg']).toBe('#112233')
      expect(customVars['--rp-text']).toBe('#ffffff')
    })
  })
})
