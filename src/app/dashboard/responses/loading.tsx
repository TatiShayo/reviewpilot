import { Skeleton } from "@/components/ui/skeleton"

export default function ResponsesLoading() {
  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    </main>
  )
}
