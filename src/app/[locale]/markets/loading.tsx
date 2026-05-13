import { Skeleton } from "@/components/ui/skeleton"

export default function MarketsLoading() {
  return (
    <div className="bg-[#F9F7F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-white">
              <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
