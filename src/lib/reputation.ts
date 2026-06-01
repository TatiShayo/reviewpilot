import { createClient } from '@/lib/supabase/server'
import { Competitor, CompetitorSnapshot, CompetitorRatingData } from '@/lib/types'

/**
 * Adds a new competitor to track for a business
 */
export async function addCompetitor(businessId: string, name: string, platform: string = 'google') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('competitors')
    .insert({
      user_id: user.id,
      business_id: businessId,
      name,
      platform,
    })
    .select()
    .single()

  if (error) throw error
  return data as Competitor
}

/**
 * Stores a periodic rating snapshot for a competitor
 */
export async function storeCompetitorSnapshot(businessId: string, competitorId: string, rating: number, date: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('competitor_snapshots')
    .insert({
      competitor_id: competitorId,
      rating,
      snapshot_date: date,
    })
    .select()
    .single()

  if (error) throw error
  return data as CompetitorSnapshot
}

/**
 * Retrieves all rating snapshots for all competitors of a business
 */
export async function getCompetitorRatings(businessId: string): Promise<CompetitorRatingData[]> {
  const supabase = await createClient()

  // Get competitors for this business
  const { data: competitors, error: compError } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('business_id', businessId)

  if (compError) throw compError
  if (!competitors || competitors.length === 0) return []

  // Get snapshots for all those competitors
  const competitorIds = competitors.map(c => c.id)
  const { data: snapshots, error: snapError } = await supabase
    .from('competitor_snapshots')
    .select('*')
    .in('competitor_id', competitorIds)
    .order('snapshot_date', { ascending: true })

  if (snapError) throw snapError

  return snapshots.map(s => ({
    name: competitors.find(c => c.id === s.competitor_id)?.name || 'Unknown',
    rating: s.rating,
    date: s.snapshot_date
  }))
}
