import { getNearbyTourRecommendationsCached, type NearbyTourType } from "@/lib/data/nearby-tour-recommendations"
import NearbyTourRecommendationsSection from "./NearbyTourRecommendations"

interface Props {
  lat: number
  lng: number
  excludeContentId: string
  tabOrder: NearbyTourType[]
  locale: string
}

export default async function NearbyTourSection({
  lat,
  lng,
  excludeContentId,
  tabOrder,
  locale,
}: Props) {
  try {
    const recommendations = await getNearbyTourRecommendationsCached(
      lat,
      lng,
      excludeContentId,
      tabOrder,
    )
    return (
      <NearbyTourRecommendationsSection
        recommendations={recommendations}
        tabOrder={tabOrder}
        locale={locale}
      />
    )
  } catch (err) {
    console.error("[NearbyTourSection] failed:", err)
    return null
  }
}
