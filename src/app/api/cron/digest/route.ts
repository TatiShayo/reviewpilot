import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDigestEmail } from '@/lib/digest-email'

export async function GET() {
  if (
    process.env.CRON_SECRET &&
    process.env.CRON_SECRET !== (process.env.CRON_SECRET_HEADER || '')
  ) {
    // Not called by Vercel cron — check auth header
  }

  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email_digest')
    .in('email_digest', ['daily', 'weekly'])

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscribers with digest enabled' })
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const results: { user: string; success: boolean }[] = []

  for (const profile of profiles) {
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', profile.id)

      if (!businesses || businesses.length === 0) continue

      const businessIds = businesses.map((b) => b.id)

      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating')
        .in('business_id', businessIds)
        .gte('created_at', weekAgo)

      const { data: responses } = await supabase
        .from('responses')
        .select('id')
        .in('review_id', (reviews || []).map((r) => r.id))

      const totalReviews = reviews?.length || 0
      const respondedCount = responses?.length || 0
      const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0
      const avgRating =
        totalReviews > 0
          ? (reviews || []).reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0

      if (totalReviews === 0) continue

      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
      const email = user?.email

      if (!email) continue

      const now = new Date()
      const weekLabel = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

      const sent = await sendDigestEmail(email, profile.full_name || 'there', {
        newReviews: totalReviews,
        respondedReviews: respondedCount,
        avgRating,
        responseRate,
        weekLabel,
      })

      results.push({ user: profile.id, success: sent.success })
    } catch (err) {
      console.error(`[Digest] Error for user ${profile.id}:`, err)
      results.push({ user: profile.id, success: false })
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    total: results.length,
  })
}
