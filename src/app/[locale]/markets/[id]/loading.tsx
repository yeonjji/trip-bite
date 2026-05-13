import { Skeleton } from "@/components/ui/skeleton"

export default function MarketDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mb-4 h-10 w-2/3" />
      <div className="mb-6 space-y-3 rounded-xl bg-[#F9F7EF] p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Skeleton className="mb-6 h-64 w-full rounded-xl" />
    </div>
  )
}
