import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockChatCreate = vi.fn()
const mockGetUser = vi.fn()
const mockProfileSelect = vi.fn()
const mockBusinessSelect = vi.fn()
const mockProfileUpdate = vi.fn()

vi.mock('openai', () => ({
  default: function OpenAI() {
    this.chat = { completions: { create: mockChatCreate } }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: mockProfileSelect,
            }),
          }),
          update: () => ({
            eq: () => mockProfileUpdate,
          }),
        }
      }
      if (table === 'businesses') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockBusinessSelect,
            }),
          }),
        }
      }
      return null
    },
  })),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { 'content-type': 'application/json' },
      })
      return response
    },
  },
  NextRequest: class extends Request {
    constructor(url: string, init?: RequestInit) {
      super(url, init)
    }
  },
}))

describe('POST /api/ai/respond', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const { POST } = await import('@/app/api/ai/respond/route')
    const req = new Request('http://localhost/api/ai/respond', {
      method: 'POST',
      body: JSON.stringify({ review_text: 'Great!', author: 'Jane' }),
    })
    const res = await POST(req as any)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when missing review_text or author', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null })
    mockProfileSelect.mockResolvedValue({
      data: { subscription_tier: 'free', responses_used_this_month: 0 },
    })

    const { POST } = await import('@/app/api/ai/respond/route')
    const req = new Request('http://localhost/api/ai/respond', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('Missing')
  })

  it('returns 429 when usage limit reached', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null })
    mockProfileSelect.mockResolvedValue({
      data: { subscription_tier: 'free', responses_used_this_month: 50 },
    })

    const { POST } = await import('@/app/api/ai/respond/route')
    const req = new Request('http://localhost/api/ai/respond', {
      method: 'POST',
      body: JSON.stringify({ review_text: 'Great!', author: 'Jane' }),
    })
    const res = await POST(req as any)
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.error).toContain('Usage limit')
  })

  it('returns 3 tone variations for valid request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null })
    mockProfileSelect.mockResolvedValue({
      data: { subscription_tier: 'free', responses_used_this_month: 0 },
    })
    mockBusinessSelect.mockResolvedValue({ data: null, error: null })

    mockChatCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Professional response here.' } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Friendly response here! 😊' } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Brief thanks!' } }],
      })

    const { POST } = await import('@/app/api/ai/respond/route')
    const req = new Request('http://localhost/api/ai/respond', {
      method: 'POST',
      body: JSON.stringify({ review_text: 'Great!', author: 'Jane', rating: 5 }),
    })
    const res = await POST(req as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.responses).toBeDefined()
    expect(body.responses.professional).toBe('Professional response here.')
    expect(body.responses.friendly).toBe('Friendly response here! 😊')
    expect(body.responses.brief).toBe('Brief thanks!')
  })

  it('returns 500 when OpenAI fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null })
    mockProfileSelect.mockResolvedValue({
      data: { subscription_tier: 'free', responses_used_this_month: 0 },
    })
    mockBusinessSelect.mockResolvedValue({ data: null, error: null })
    mockChatCreate.mockRejectedValue(new Error('OpenAI API error'))

    const { POST } = await import('@/app/api/ai/respond/route')
    const req = new Request('http://localhost/api/ai/respond', {
      method: 'POST',
      body: JSON.stringify({ review_text: 'Great!', author: 'Jane' }),
    })
    const res = await POST(req as any)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to generate responses')
  })
})
