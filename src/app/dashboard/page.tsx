import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogoutButton } from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">ReviewPilot</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="mt-2 text-muted-foreground">Your review management overview.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">Reviews Today</p>
            <p className="mt-2 text-2xl font-bold">0</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
            <p className="mt-2 text-2xl font-bold">0%</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
            <p className="mt-2 text-2xl font-bold">—</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">Locations</p>
            <p className="mt-2 text-2xl font-bold">0</p>
          </div>
        </div>
      </main>
    </div>
  )
}
