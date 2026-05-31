import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const snapshotSchema = z.object({
  competitor_id: z.string().uuid(),
  rating: z.number().min(0).max(5),
  total_reviews: z.number().int().min(0).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = snapshotSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }
  const { competitor_id, rating, total_reviews } = parsed.data

  const { data: competitor } = await supabase
    .from('competitors')
    .select('id')
    .eq('id', competitor_id)
    .eq('user_id', user.id)
    .single()

  if (!competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
  }

  await supabase
    .from('competitors')
    .update({ rating, total_reviews: total_reviews || 0, updated_at: new Date().toISOString() })
    .eq('id', competitor_id)

  const { data: snapshot } = await supabase
    .from('competitor_snapshots')
    .insert({ competitor_id, rating, total_reviews: total_reviews || 0 })
    .select()
    .single()

  return NextResponse.json({ snapshot })
}
