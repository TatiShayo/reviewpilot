import { createClient } from '@/lib/supabase/server'

const FREE_LIMIT = 50

interface CheckUsageResult {
  allowed: boolean
  remaining: number | null
  tier: string
}

export async function checkUsage(userId: string): Promise<CheckUsageResult> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, responses_used_this_month')
    .eq('id', userId)
    .single()

  const tier = profile?.subscription_tier || 'free'
  const used = profile?.responses_used_this_month || 0

  if (tier === 'pro' || tier === 'business') {
    return { allowed: true, remaining: null, tier }
  }

  const remaining = Math.max(0, FREE_LIMIT - used)
  return { allowed: remaining > 0, remaining, tier }
}

export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient()

  // Atomic increment via RPC. The previous read-modify-write had two
  // defects: it raced under concurrency (two requests both read N and
  // both wrote N+1, losing an increment), and migration 006's
  // privilege-escalation trigger pins responses_used_this_month for
  // end-user sessions, so the plain UPDATE was silently reverted and the
  // counter never moved. The RPC increments under the database's row
  // lock and is the only path the trigger permits.
  const { error } = await supabase.rpc('increment_responses_used', {
    p_user_id: userId,
  })

  if (error) {
    throw new Error(`Failed to increment usage: ${error.message}`)
  }
}
