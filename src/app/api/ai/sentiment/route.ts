import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod'

const sentimentSchema = z.object({
  review_text: z.string().min(1),
})

let openaiClient: OpenAI | null = null

function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = sentimentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { review_text } = parsed.data

    const completion = await getOpenAI().chat.completions.create({
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

    const raw = completion.choices[0]?.message?.content?.trim() || '{}'
    let result: { sentiment: string; score: number }

    try {
      result = JSON.parse(raw)
    } catch {
      result = { sentiment: 'neutral', score: 0 }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    )
  }
}
