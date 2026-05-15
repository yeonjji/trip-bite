import { Skeleton } from "@/components/ui/skeleton"

export default function NearbyFacilitiesSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 mb-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
