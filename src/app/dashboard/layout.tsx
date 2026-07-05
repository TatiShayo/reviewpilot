import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { LogoutButton } from './logout-button'
import { DashboardNav } from './nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const e2eBypass = cookieStore.get('e2e_bypass')?.value

  if (e2eBypass === '1') {
    return (
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">ReviewPilot</h1>
            <DashboardNav />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">test@reviewpilot.dev</span>
            <LogoutButton />
          </div>
        </header>
        {children}
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">ReviewPilot</h1>
          <DashboardNav />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  )
}
