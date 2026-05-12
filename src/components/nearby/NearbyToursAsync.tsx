import { getNearbyTourRecommendationsCached, type NearbyTourType } from "@/lib/data/nearby-tour-recommendations"
import NearbyTourRecommendationsSection from "@/components/nearby/NearbyTourRecommendations"

type Props = {
  lat: number
  lng: number
  excludeContentId?: string | null
  types: NearbyTourType[]
  tabOrder: NearbyTourType[]
  locale: string
}

export default async function NearbyToursAsync({
  lat,
  lng,
  excludeContentId,
  types,
  tabOrder,
  locale,
}: Props) {
  const recommendations = await getNearbyTourRecommendationsCached(
    lat,
    lng,
    excludeContentId ?? null,
    types,
  )
  return (
    <NearbyTourRecommendationsSection
      recommendations={recommendations}
      tabOrder={tabOrder}
      locale={locale}
    />
  )
}

export function NearbyToursSkeleton() {
  return (
    <div className="mb-8">
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
