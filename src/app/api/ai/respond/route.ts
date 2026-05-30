import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUsage, incrementUsage } from '@/lib/gate'
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

    const usage = await checkUsage(user.id)
    if (!usage.allowed) {
      return NextResponse.json(
        { error: `Usage limit reached. You've used ${usage.remaining === 0 ? 'all your' : ''} ${usage.remaining === 0 ? '50' : ''} free responses this month. Upgrade to Pro for unlimited.` },
        { status: 429 }
      )
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

    const { data: templates } = await supabase
      .from('response_templates')
      .select('name, tone, body')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const templateHints =
      templates && templates.length > 0
        ? `\n\nUse these templates as style references for your responses. Match the tone and patterns shown (but adapt to the specific review):\n${templates.map((t, i) => `${i + 1}. [${t.tone}] ${t.name}: "${t.body}"`).join('\n')}`
        : ''

    const tones = ['professional', 'friendly', 'brief'] as const
    const results: Record<string, string> = {}

    await Promise.all(
      tones.map(async (tone) => {
        const completion = await getOpenAI().chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that writes responses to customer reviews for a local business. ${TONE_PROMPTS[tone]}${templateHints}`,
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

    await incrementUsage(user.id)

    return NextResponse.json({ responses: results })
  } catch (error) {
    console.error('AI respond error:', error)
    return NextResponse.json(
      { error: 'Failed to generate responses' },
      { status: 500 }
    )
  }
}
