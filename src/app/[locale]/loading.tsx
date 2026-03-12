// P4-15: 홈페이지 로딩 스켈레톤

import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="flex flex-col">
      {/* 히어로 스켈레톤 */}
      <div className="px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="mx-auto h-10 w-64 md:h-14 md:w-80" />
          <Skeleton className="mx-auto h-6 w-80" />
          <Skeleton className="mx-auto h-12 w-full max-w-lg" />
          <div className="flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* 추천 여행지 스켈레톤 */}
      <div className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="mb-4 h-7 w-32" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-52 flex-none space-y-2 md:w-64">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 지역 그리드 스켈레톤 */}
      <div className="bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="mb-6 h-7 w-40" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* 특산품 스켈레톤 */}
      <div className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="mb-4 h-7 w-40" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
