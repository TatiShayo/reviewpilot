import { Skeleton } from "@/components/ui/skeleton"

export default function RootLoading() {
  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-4 w-96 mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </main>
  )
}
