import { Skeleton } from "@/components/ui/skeleton"

export default function IntroSkeleton() {
  return (
    <div className="mb-6 space-y-3 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}
