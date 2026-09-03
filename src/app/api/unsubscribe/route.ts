import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken, recordOptOut } from '@/lib/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { searchParams } = new URL(request.url)
    const token = body.token || searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing unsubscribe token' }, { status: 400 })
    }

    const verification = verifyUnsubscribeToken(token)
    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        { error: verification.error || 'Invalid or expired unsubscribe token' },
        { status: 400 }
      )
    }

    const { email, tenantId, type } = verification.payload

    // Record opt-out in memory suppression list
    recordOptOut(tenantId, email)

    // Update database if configured
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createAdminClient()
        if (type === 'digest' || type === 'all') {
          await supabase
            .from('profiles')
            .update({ email_digest: 'never' })
            .eq('id', tenantId)
        }
      }
    } catch (dbErr) {
      console.warn('[Unsubscribe] DB update skipped:', dbErr)
    }

    return NextResponse.json({
      success: true,
      message: `You have successfully unsubscribed from ${type === 'all' ? 'all emails' : type + ' emails'}.`,
      email,
      type,
    })
  } catch (err) {
    console.error('[Unsubscribe] Route error:', err)
    return NextResponse.json({ error: 'Failed to process unsubscribe' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing unsubscribe token' }, { status: 400 })
  }

  const verification = verifyUnsubscribeToken(token)
  if (!verification.valid || !verification.payload) {
    return NextResponse.json(
      { error: verification.error || 'Invalid or expired unsubscribe token' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    valid: true,
    email: verification.payload.email,
    type: verification.payload.type,
  })
}
