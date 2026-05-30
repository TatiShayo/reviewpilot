import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="mt-2 text-2xl font-bold">Page not found</h2>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  )
}
