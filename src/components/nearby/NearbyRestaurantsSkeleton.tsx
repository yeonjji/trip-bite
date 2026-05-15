import { Skeleton } from "@/components/ui/skeleton"

export default function NearbyRestaurantsSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between mb-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-40 shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
