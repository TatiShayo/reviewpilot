'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ButtonLink } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export function Nav() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MessageSquare className="h-5 w-5" />
          ReviewPilot
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <ButtonLink variant="ghost" href="/dashboard">Dashboard</ButtonLink>
          ) : (
            <>
              <ButtonLink variant="ghost" href="/login">Sign in</ButtonLink>
              <ButtonLink href="/signup">Get started</ButtonLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
