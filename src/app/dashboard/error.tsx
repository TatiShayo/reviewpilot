'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">ReviewPilot</h1>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold">Dashboard error</h2>
          <p className="mt-2 text-muted-foreground">
            {error.message || 'Failed to load dashboard data.'}
          </p>
          <Button onClick={reset} className="mt-6">
            Try again
          </Button>
        </div>
      </main>
    </div>
  )
}
