import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in trusted
 * server-side contexts (Stripe webhook, cron jobs). Never expose to the
 * browser and never construct from a request that isn't authenticated as
 * a trusted caller.
 */
export function createAdminClient(): SupabaseClient {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase service-role credentials are not configured.')
    }
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return adminClient
}
