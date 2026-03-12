// P4-16: 맛집 상세 로딩 스켈레톤

import { Skeleton } from "@/components/ui/skeleton"

export default function RestaurantDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-4 h-5 w-32" />
      <Skeleton className="mb-6 aspect-video w-full rounded-xl" />
      <div className="mb-6 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )
}
