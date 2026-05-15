import { getNearbyRestaurantsCached } from "@/lib/data/restaurants"
import HorizontalScrollSection from "@/components/shared/HorizontalScrollSection"
import { getAreaName } from "@/lib/constants/area-codes"

interface Props {
  lat: number
  lng: number
  excludeContentId: string
  locale: string
  isKo: boolean
}

export default async function NearbyRestaurantsSection({
  lat,
  lng,
  excludeContentId,
  locale,
  isKo,
}: Props) {
  try {
    const restaurants = await getNearbyRestaurantsCached(lat, lng, excludeContentId)
    if (restaurants.length === 0) return null
    return (
      <HorizontalScrollSection
        title={isKo ? "근처 맛집" : "Nearby Restaurants"}
        moreHref={`/${locale}/restaurants`}
        moreLabel={isKo ? "맛집 전체" : "All Restaurants"}
        items={restaurants.map((r) => ({
          href: `/${locale}/restaurants/${r.content_id}`,
          imageUrl: r.first_image,
          imagePlaceholder: "🍽",
          tag: getAreaName(r.area_code ?? ""),
          title: r.title,
          sub: r.addr1,
        }))}
      />
    )
  } catch (err) {
    console.error("[NearbyRestaurantsSection] failed:", err)
    return null
  }
}
