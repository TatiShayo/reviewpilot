import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUsage, incrementUsage } from '@/lib/gate'
import { checkRateLimit } from '@/lib/rate-limit'
import OpenAI from 'openai'
import { z } from 'zod'

// Input contract shared with the reviews dashboard (ReviewCard.handleGenerate).
const respondSchema = z.object({
  review_text: z.string().min(1).max(5000),
  author: z.string().min(1).max(200),
  rating: z.number().int().min(1).max(5).optional(),
  business_name: z.string().max(200).optional(),
  business_id: z.string().max(200).optional(),
})

const TONES = [
  {
    key: 'professional',
    instruction:
      'Write a professional, courteous reply a business owner would post publicly. Address the reviewer by name if natural.',
  },
  {
    key: 'friendly',
    instruction:
      'Write a warm, friendly reply with a personal, approachable tone. A single tasteful emoji is acceptable.',
  },
  {
    key: 'brief',
    instruction: 'Write a very short, one-to-two sentence reply that is polite and to the point.',
  },
] as const

let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Authentication: this endpoint calls a paid LLM; it must never be public.
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = respondSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Abuse protection #1: short-window per-user rate limit (burst control).
    const rl = checkRateLimit(`ai-respond:${user.id}`, 20, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        { status: 429 }
      )
    }

    // Abuse protection #2: monthly plan quota (cost control).
    const usage = await checkUsage(user.id)
    if (!usage.allowed) {
      return NextResponse.json(
        { error: `Usage limit reached for the ${usage.tier} plan. Upgrade to generate more responses.` },
        { status: 429 }
      )
    }

    const { review_text, author, rating, business_name, business_id } = parsed.data

    // Authorization / IDOR: if a business is referenced, confirm it belongs to
    // the caller. RLS already scopes this query to the user's own rows, so a
    // foreign business_id simply yields null and is treated as no context.
    let ownedBusinessName = business_name
    if (business_id) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('id', business_id)
        .maybeSingle()
      if (biz?.name) ownedBusinessName = biz.name
    }

    const context = [
      `Business: ${ownedBusinessName || 'the business'}`,
      rating ? `Star rating: ${rating}/5` : null,
      `Reviewer: ${author}`,
      `Review: "${review_text}"`,
    ]
      .filter(Boolean)
      .join('\n')

    let responses: Record<string, string>
    try {
      const openai = getOpenAI()
      const generated: Record<string, string> = {}
      for (const tone of TONES) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You reply to Google reviews on behalf of a business. ${tone.instruction} Never invent facts. Output only the reply text with no preamble.`,
            },
            { role: 'user', content: context },
          ],
          max_tokens: 300,
          temperature: 0.7,
        })
        generated[tone.key] = completion.choices[0]?.message?.content?.trim() || ''
      }
      responses = generated
    } catch (err) {
      console.error('AI respond generation failed:', err)
      return NextResponse.json({ error: 'Failed to generate responses' }, { status: 500 })
    }

    // Only count usage once generation actually succeeded.
    await incrementUsage(user.id)

    return NextResponse.json({ responses })
  } catch (err) {
    console.error('AI respond route error:', err)
    return NextResponse.json({ error: 'Failed to generate responses' }, { status: 500 })
  }
}
