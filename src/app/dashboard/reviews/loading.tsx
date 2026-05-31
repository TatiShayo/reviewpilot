import { Skeleton } from "@/components/ui/skeleton"

export default function ReviewsLoading() {
  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="flex gap-2 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-md" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </main>
  )
}
