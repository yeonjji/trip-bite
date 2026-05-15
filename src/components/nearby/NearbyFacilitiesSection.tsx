import { getNearbyFacilitiesCached } from "@/lib/data/nearby-facilities"
import NearbyFacilities from "@/app/[locale]/travel/_components/NearbyFacilities"

interface Props {
  lat: number
  lng: number
  locale: string
}

export default async function NearbyFacilitiesSection({ lat, lng, locale }: Props) {
  try {
    const data = await getNearbyFacilitiesCached(lat, lng)
    return (
      <NearbyFacilities
        locale={locale}
        toilets={data.toilets}
        wifi={data.wifi}
        parking={data.parking}
        evStations={data.evStations}
        lat={lat}
        lng={lng}
      />
    )
  } catch (err) {
    console.error("[NearbyFacilitiesSection] failed:", err)
    return null
  }
}
