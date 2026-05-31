import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUsage, incrementUsage } from '@/lib/gate'
import { checkRateLimit } from '@/lib/rate-limit'
import OpenAI from 'openai'
import { z } from 'zod'

const respondSchema = z.object({
  review_text: z.string().min(1),
  author: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  business_name: z.string().optional(),
  business_id: z.string().uuid().optional(),
})

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

const LANG_PATTERNS: [RegExp, string][] = [
  [/[àâäéèêëîïôöùûüçœ]/i, 'French'],
  [/[áéíóúüñ¿¡]/i, 'Spanish'],
  [/[ãõâêôçáéíóúà]/i, 'Portuguese'],
  [/[äöüß]/i, 'German'],
  [/[àèéìòù]/i, 'Italian'],
]

function detectLanguage(text: string): string {
  for (const [pattern, lang] of LANG_PATTERNS) {
    if (pattern.test(text)) return lang
  }
  return 'English'
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

    const rateLimit = checkRateLimit(user.id, 10, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 10 requests per minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = respondSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { review_text, author, rating, business_name, business_id } = parsed.data

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
    const detectedLang = detectLanguage(review_text)
    const langInstruction = detectedLang !== 'English' ? ` Write your response in ${detectedLang} since the review is in ${detectedLang}.` : ''

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
              content: `You are a helpful assistant that writes responses to customer reviews for a local business. ${TONE_PROMPTS[tone]}${langInstruction}${templateHints}`,
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
