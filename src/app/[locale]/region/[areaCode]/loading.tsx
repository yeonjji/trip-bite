// P4-17: 지역 허브 로딩 스켈레톤

import { Skeleton } from "@/components/ui/skeleton"

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export default function RegionHubLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-2 h-9 w-40" />
      <Skeleton className="mb-8 h-5 w-64" />

      {/* 날씨 위젯 스켈레톤 */}
      <Skeleton className="mb-8 h-24 w-full rounded-xl" />

      {/* 여행지 섹션 */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <CardGridSkeleton />
      </div>

      {/* 맛집 섹션 */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <CardGridSkeleton />
      </div>

      {/* 캠핑장 섹션 */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <CardGridSkeleton />
      </div>

      {/* 특산품 섹션 */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <CardGridSkeleton />
      </div>
    </div>
  )
}
