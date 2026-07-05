import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="flex gap-2 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </main>
  )
}
