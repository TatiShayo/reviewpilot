import { NextRequest, NextResponse } from 'next/server'
import { verifyWidgetEmbedToken, getWidgetSecurityHeaders } from '@/lib/embed-token'
import { sanitizeWidgetInput } from '@/lib/widget-config'
import { classifySentimentHeuristic } from '@/lib/sentiment'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const reviewSubmitSchema = z.object({
  token: z.string().min(1),
  author_name: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
})

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getWidgetSecurityHeaders(['*'], origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip'

  // Anti-spam: Rate limit public review submissions by client IP (5 per 10 minutes)
  const rl = checkRateLimit(`widget-submit:${clientIp}`, 5, 10 * 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: getWidgetSecurityHeaders(['*'], origin) }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = reviewSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid submission data', details: parsed.error.flatten() },
      { status: 400, headers: getWidgetSecurityHeaders(['*'], origin) }
    )
  }

  const { token, author_name, rating, text, email } = parsed.data

  // Verify signed embed token
  const tokenVerification = verifyWidgetEmbedToken(token, origin)
  if (!tokenVerification.valid || !tokenVerification.payload) {
    return NextResponse.json(
      { error: tokenVerification.error || 'Unauthorized embed token' },
      { status: 401, headers: getWidgetSecurityHeaders(['*'], origin) }
    )
  }

  const { businessId, allowedDomains } = tokenVerification.payload
  const securityHeaders = getWidgetSecurityHeaders(allowedDomains, origin)

  // Sanitize user inputs to prevent XSS
  const cleanAuthor = sanitizeWidgetInput(author_name)
  const cleanText = sanitizeWidgetInput(text)

  // Automatic sentiment analysis
  const sentimentResult = classifySentimentHeuristic(cleanText, rating)

  // Persist to database if Supabase configured, otherwise mock success
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createAdminClient()
      await supabaseAdmin.from('reviews').insert({
        business_id: businessId,
        author: cleanAuthor,
        rating,
        text: cleanText,
        sentiment: sentimentResult.sentiment,
        source: 'widget',
        review_date: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('[Widget Submit] Error saving review:', err)
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Thank you for your review!',
      sentiment: sentimentResult.sentiment,
    },
    { status: 201, headers: securityHeaders }
  )
}
