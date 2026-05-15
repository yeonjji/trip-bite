import { Skeleton } from "@/components/ui/skeleton"

export default function WikiSkeleton() {
  return (
    <div className="mb-6 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-start gap-3">
        <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  )
}
