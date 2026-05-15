import { Skeleton } from "@/components/ui/skeleton"

export default function NearbyTourSkeleton() {
  return (
    <section className="mb-6">
      <div className="mb-4">
        <Skeleton className="h-3 w-16 mb-1" />
        <Skeleton className="h-7 w-72" />
      </div>
      <div className="mb-3 flex gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    </section>
  )
}
