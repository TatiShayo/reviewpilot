import { Skeleton } from "@/components/ui/skeleton"

export default function BillingLoading() {
  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-48 mb-8" />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </main>
  )
}
