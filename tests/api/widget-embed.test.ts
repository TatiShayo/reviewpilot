import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getWidgetConfig, OPTIONS as optionsWidgetConfig } from '@/app/api/widget/config/route'
import { POST as submitWidgetReview, OPTIONS as optionsWidgetSubmit } from '@/app/api/widget/submit/route'
import { POST as unsubscribePost, GET as unsubscribeGet } from '@/app/api/unsubscribe/route'
import { generateWidgetEmbedToken } from '@/lib/embed-token'
import { generateUnsubscribeToken, isOptedOut } from '@/lib/unsubscribe'

describe('Widget Embed & Unsubscribe API Routes', () => {
  const secretKey = 'test_secret_for_api_route_verification'

  beforeEach(() => {
    process.env.EMBED_TOKEN_SECRET = secretKey
    process.env.UNSUBSCRIBE_SECRET = secretKey
  })

  describe('/api/widget/config', () => {
    it('handles OPTIONS preflight with CORS headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/widget/config', {
        method: 'OPTIONS',
        headers: { origin: 'https://myshop.com' },
      })
      const res = await optionsWidgetConfig(req)
      expect(res.status).toBe(204)
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    })

    it('returns 400 when embed token is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/widget/config', {
        method: 'GET',
      })
      const res = await getWidgetConfig(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Missing widget embed token')
    })

    it('returns 401 when embed token is invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/widget/config?token=invalid.token', {
        method: 'GET',
      })
      const res = await getWidgetConfig(req)
      expect(res.status).toBe(401)
    })

    it('returns widget configuration and 200 when token is valid', async () => {
      const token = generateWidgetEmbedToken(
        {
          businessId: 'biz-test-1',
          tenantId: 'tenant-test-1',
          allowedDomains: ['*'],
        },
        secretKey
      )

      const req = new NextRequest(`http://localhost:3000/api/widget/config?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      })
      const res = await getWidgetConfig(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.businessId).toBe('biz-test-1')
      expect(data.config).toBeDefined()
      expect(data.config.theme).toBe('light')
    })
  })

  describe('/api/widget/submit', () => {
    it('handles OPTIONS preflight', async () => {
      const req = new NextRequest('http://localhost:3000/api/widget/submit', {
        method: 'OPTIONS',
      })
      const res = await optionsWidgetSubmit(req)
      expect(res.status).toBe(204)
    })

    it('accepts valid review submission and performs sentiment analysis', async () => {
      const token = generateWidgetEmbedToken(
        {
          businessId: 'biz-test-2',
          tenantId: 'tenant-test-2',
          allowedDomains: ['*'],
        },
        secretKey
      )

      const req = new NextRequest('http://localhost:3000/api/widget/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          author_name: 'Emily R.',
          rating: 5,
          text: 'Super friendly staff and delicious coffee!',
          email: 'emily@example.com',
        }),
      })

      const res = await submitWidgetReview(req)
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.sentiment).toBe('positive')
    })

    it('rejects submission with invalid rating (< 1 or > 5)', async () => {
      const token = generateWidgetEmbedToken(
        {
          businessId: 'biz-test-3',
          tenantId: 'tenant-test-3',
          allowedDomains: ['*'],
        },
        secretKey
      )

      const req = new NextRequest('http://localhost:3000/api/widget/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          author_name: 'Bob',
          rating: 10, // Invalid
        }),
      })

      const res = await submitWidgetReview(req)
      expect(res.status).toBe(400)
    })
  })

  describe('/api/unsubscribe', () => {
    it('verifies unsubscribe token via GET', async () => {
      const token = generateUnsubscribeToken('alex@test.com', 'tenant-88', 'digest', 30, secretKey)
      const req = new NextRequest(`http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      })
      const res = await unsubscribeGet(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.valid).toBe(true)
      expect(data.email).toBe('alex@test.com')
    })

    it('records recipient opt-out via POST', async () => {
      const token = generateUnsubscribeToken('sarah@test.com', 'tenant-88', 'all', 30, secretKey)
      const req = new NextRequest('http://localhost:3000/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const res = await unsubscribePost(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(isOptedOut('tenant-88', 'sarah@test.com')).toBe(true)
    })

    it('rejects POST with missing token', async () => {
      const req = new NextRequest('http://localhost:3000/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const res = await unsubscribePost(req)
      expect(res.status).toBe(400)
    })
  })
})
