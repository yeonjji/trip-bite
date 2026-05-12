import { getNearbyFacilitiesCached } from "@/lib/data/nearby-facilities"
import NearbyFacilities from "@/app/[locale]/travel/_components/NearbyFacilities"

type Props = {
  lat: number
  lng: number
  locale: string
}

export default async function NearbyFacilitiesAsync({ lat, lng, locale }: Props) {
  const data = await getNearbyFacilitiesCached(lat, lng)
  return (
    <NearbyFacilities
      locale={locale}
      toilets={data.toilets}
      wifi={data.wifi}
      parking={data.parking}
      evStations={data.evStations}
    />
  )
}

export function NearbyFacilitiesSkeleton() {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
