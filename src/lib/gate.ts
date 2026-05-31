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

  const { data: profile } = await supabase
    .from('profiles')
    .select('responses_used_this_month')
    .eq('id', userId)
    .single()

  const newCount = (profile?.responses_used_this_month || 0) + 1

  await supabase
    .from('profiles')
    .update({ responses_used_this_month: newCount })
    .eq('id', userId)
}
