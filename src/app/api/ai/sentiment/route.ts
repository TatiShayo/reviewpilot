import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { parseOrFallbackLLMSentiment, classifySentimentHeuristic } from '@/lib/sentiment'
import OpenAI from 'openai'
import { z } from 'zod'

const sentimentSchema = z.object({
  review_text: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5).optional(),
})

let openaiClient: OpenAI | null = null

function getOpenAI() {
  if (!openaiClient) {
    const key = process.env.OPENAI_API_KEY
    if (key) {
      openaiClient = new OpenAI({ apiKey: key })
    }
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Abuse protection: burst limit on this endpoint.
    const rl = checkRateLimit(`ai-sentiment:${user.id}`, 30, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    const parsed = sentimentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { review_text, rating } = parsed.data

    const openai = getOpenAI()
    if (!openai || !process.env.OPENAI_API_KEY) {
      // Fallback directly to heuristic classification when OpenAI is not configured
      const fallbackResult = classifySentimentHeuristic(review_text, rating)
      return NextResponse.json(fallbackResult)
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Analyze the sentiment of this customer review. Return ONLY a JSON object with two fields: "sentiment" (one of: "positive", "negative", "neutral") and "score" (a number from -1.0 to 1.0, where -1 is very negative, 0 is neutral, and 1 is very positive). Do not include any other text.',
          },
          {
            role: 'user',
            content: review_text,
          },
        ],
        max_tokens: 50,
        temperature: 0,
      })

      const raw = completion.choices[0]?.message?.content || '{}'
      const result = parseOrFallbackLLMSentiment(raw, review_text, rating)
      return NextResponse.json(result)
    } catch (llmError) {
      console.warn('OpenAI sentiment classification failed, falling back to heuristic:', llmError)
      const fallbackResult = classifySentimentHeuristic(review_text, rating)
      return NextResponse.json(fallbackResult)
    }
  } catch (error) {
    console.error('Sentiment analysis route error:', error)
    return NextResponse.json({ error: 'Failed to analyze sentiment' }, { status: 500 })
  }
}
