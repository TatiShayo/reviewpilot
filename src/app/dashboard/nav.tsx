'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/businesses', label: 'Businesses' },
  { href: '/dashboard/reviews', label: 'Reviews' },
  { href: '/dashboard/responses', label: 'Responses' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            pathname === link.href
              ? 'bg-muted font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
