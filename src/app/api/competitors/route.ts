import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('business_id')

  let query = supabase
    .from('competitors')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (businessId) {
    query = query.eq('business_id', businessId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const snapshotQuery = supabase
    .from('competitor_snapshots')
    .select('*')
    .in('competitor_id', (data || []).map((c) => c.id))
    .order('snapshot_date', { ascending: false })

  const { data: snapshots } = await snapshotQuery

  const result = (data || []).map((competitor) => ({
    ...competitor,
    snapshots: (snapshots || []).filter((s) => s.competitor_id === competitor.id),
  }))

  return NextResponse.json({ competitors: result })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, business_id, gmb_handle, rating, total_reviews } = body

  if (!name) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('competitors')
    .insert({
      user_id: user.id,
      business_id: business_id || null,
      name,
      gmb_handle: gmb_handle || null,
      rating: rating || 0,
      total_reviews: total_reviews || 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ competitor: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
