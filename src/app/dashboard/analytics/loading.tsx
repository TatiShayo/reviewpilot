import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />
      <Skeleton className="h-64 rounded-lg" />
    </main>
  )
}
