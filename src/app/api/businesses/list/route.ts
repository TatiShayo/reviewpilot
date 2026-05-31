import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMockBusinesses } from '@/lib/mock-data'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ businesses: [] })

    const { data, error } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error || !data || data.length === 0) {
      return NextResponse.json({ businesses: getMockBusinesses() })
    }

    return NextResponse.json({ businesses: data })
  } catch {
    return NextResponse.json({ businesses: getMockBusinesses() })
  }
}
