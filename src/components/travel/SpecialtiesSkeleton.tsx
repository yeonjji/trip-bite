import { Skeleton } from "@/components/ui/skeleton"

export default function SpecialtiesSkeleton() {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
