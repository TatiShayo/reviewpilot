import Link from 'next/link'
import { ButtonLink } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

export function Nav() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MessageSquare className="h-5 w-5" />
          ReviewPilot
        </Link>
        <div className="flex items-center gap-3">
          <ButtonLink variant="ghost" href="/login">Sign in</ButtonLink>
          <ButtonLink href="/signup">Get started</ButtonLink>
        </div>
      </nav>
    </header>
  )
}
