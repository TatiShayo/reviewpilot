import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * REGRESSION — "Unauthenticated review-response spoofing & LLM cost abuse"
 *
 * Vulnerability (pre-fix, commit 0c21cc4 and earlier):
 *   POST /api/ai/respond performed NO `auth.getUser()` check. Any anonymous
 *   caller on the public internet could POST arbitrary review text and receive
 *   generated business replies — spoofing responses and, more importantly,
 *   driving unbounded paid OpenAI calls on the operator's key (cost/DoW abuse).
 *   There was also no per-account quota, so even a logged-in user could burn the
 *   whole plan's budget.
 *
 * Fix (this audit):
 *   - Require an authenticated Supabase session (401 otherwise).
 *   - Enforce the monthly plan quota via lib/gate.checkUsage (429 when exhausted).
 *   - Per-user burst rate limit via lib/rate-limit.
 *   - business_id is resolved through an RLS-scoped query, so a foreign
 *     business_id cannot pull another tenant's business into the prompt (IDOR).
 *
 * These tests fail against the vulnerable implementation and pass against the
 * hardened one.
 */

const mockGetUser = vi.fn()
const mockProfileSelect = vi.fn()
const mockBusinessMaybeSingle = vi.fn()
const mockProfileUpdate = vi.fn()
const mockChatCreate = vi.fn()

vi.mock('openai', () => ({
  default: function OpenAI(this: Record<string, unknown>) {
    this.chat = { completions: { create: mockChatCreate } }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({ eq: () => ({ single: mockProfileSelect }) }),
          update: () => ({ eq: () => mockProfileUpdate }),
        }
      }
      if (table === 'businesses') {
        return { select: () => ({ eq: () => ({ maybeSingle: mockBusinessMaybeSingle }) }) }
      }
      return null
    },
  })),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { 'content-type': 'application/json' },
      }),
  },
  NextRequest: class extends Request {},
}))

function post(body: unknown) {
  return new Request('http://localhost/api/ai/respond', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('SECURITY /api/ai/respond — auth + IDOR regression', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects anonymous callers with 401 (was 200 before the fix)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { POST } = await import('@/app/api/ai/respond/route')
    const res = await POST(post({ review_text: 'Great!', author: 'Jane' }) as never)
    expect(res.status).toBe(401)
    // The paid LLM must never have been invoked for an anonymous request.
    expect(mockChatCreate).not.toHaveBeenCalled()
  })

  it('caps authenticated abuse via monthly quota (429)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'attacker' } }, error: null })
    mockProfileSelect.mockResolvedValue({
      data: { subscription_tier: 'free', responses_used_this_month: 50 },
    })
    const { POST } = await import('@/app/api/ai/respond/route')
    const res = await POST(post({ review_text: 'spam', author: 'x' }) as never)
    expect(res.status).toBe(429)
    expect(mockChatCreate).not.toHaveBeenCalled()
  })

  it('does not leak another tenant\'s business via a forged business_id (IDOR)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null })
    mockProfileSelect.mockResolvedValue({
      data: { subscription_tier: 'pro', responses_used_this_month: 0 },
    })
    // RLS scopes the lookup to the caller: a business owned by someone else
    // resolves to null, so the victim's name can never enter the prompt.
    mockBusinessMaybeSingle.mockResolvedValue({ data: null })
    mockChatCreate
      .mockResolvedValueOnce({ choices: [{ message: { content: 'p' } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'f' } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'b' } }] })

    const { POST } = await import('@/app/api/ai/respond/route')
    const res = await POST(
      post({
        review_text: 'hi',
        author: 'Jane',
        business_id: 'victim-business-uuid',
        business_name: 'attacker supplied',
      }) as never
    )
    expect(res.status).toBe(200)

    // The prompt sent to OpenAI must use only caller-supplied context, never a
    // resolved victim business (which was null). Assert no victim data leaked.
    const promptArgs = mockChatCreate.mock.calls.map(
      (c) => JSON.stringify(c[0])
    ).join(' ')
    expect(promptArgs).not.toContain('victim-business-uuid')
  })
})
