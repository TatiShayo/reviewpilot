import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

const TONE_PROMPTS: Record<string, string> = {
  professional: 'Write a professional, courteous response that thanks the reviewer, addresses their specific points, and reflects well on the business. Do not include placeholders like [Name]. Sign as "The Team".',
  friendly: 'Write a warm, friendly, and personable response. Use casual but respectful language. Make the reviewer feel heard and appreciated. Do not include placeholders. Sign with a smiley emoji.',
  brief: 'Write a short, concise response in 1-2 sentences. Be polite and thankful but get straight to the point. Do not include placeholders.',
}

function applySignature(text: string, signature: string | null): string {
  if (!signature) return text
  const trimmed = text.trimEnd()
  return trimmed + '\n\n' + signature.trim()
}

function filterBlacklistedWords(text: string, blacklist: string[]): string {
  if (!blacklist || blacklist.length === 0) return text
  let result = text
  for (const word of blacklist) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    result = result.replace(regex, '***')
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { review_text, author, rating, business_name, business_id } = body

    if (!review_text || !author) {
      return NextResponse.json({ error: 'Missing review_text or author' }, { status: 400 })
    }

    let signature: string | null = null
    let blacklistedWords: string[] = []

    if (business_id) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('response_signature, blacklisted_words')
        .eq('id', business_id)
        .maybeSingle()

      if (biz) {
        signature = biz.response_signature
        blacklistedWords = biz.blacklisted_words || []
      }
    }

    const reviewContext = `Review by ${author}: ${rating ? `${rating}/5 stars. ` : ''}"${review_text}"${business_name ? ` — for ${business_name}` : ''}`
    if (blacklistedWords.length > 0) {
      const bl = blacklistedWords.join(', ')
      TONE_PROMPTS.professional += ` IMPORTANT: Do NOT use any of these words/phrases: ${bl}.`
      TONE_PROMPTS.friendly += ` IMPORTANT: Do NOT use any of these words/phrases: ${bl}.`
      TONE_PROMPTS.brief += ` IMPORTANT: Do NOT use any of these words/phrases: ${bl}.`
    }

    const tones = ['professional', 'friendly', 'brief'] as const
    const results: Record<string, string> = {}

    await Promise.all(
      tones.map(async (tone) => {
        const completion = await getOpenAI().chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that writes responses to customer reviews for a local business. ${TONE_PROMPTS[tone]}`,
            },
            {
              role: 'user',
              content: `Write a ${tone} response to this review:\n\n${reviewContext}`,
            },
          ],
          max_tokens: 300,
          temperature: tone === 'brief' ? 0.3 : 0.7,
        })
        let text = completion.choices[0]?.message?.content?.trim() || ''
        text = filterBlacklistedWords(text, blacklistedWords)
        text = applySignature(text, signature)
        results[tone] = text
      })
    )

    const monthKey = new Date().toISOString().slice(0, 7) + '-01'

    const { data: currentUsage } = await supabase
      .from('usage')
      .select('responses_used')
      .eq('user_id', user.id)
      .eq('month', monthKey)
      .maybeSingle()

    const newCount = (currentUsage?.responses_used || 0) + 1

    await supabase
      .from('usage')
      .upsert({
        user_id: user.id,
        month: monthKey,
        responses_used: newCount,
      }, {
        onConflict: 'user_id,month',
      })

    return NextResponse.json({ responses: results })
  } catch (error) {
    console.error('AI respond error:', error)
    return NextResponse.json(
      { error: 'Failed to generate responses' },
      { status: 500 }
    )
  }
}
