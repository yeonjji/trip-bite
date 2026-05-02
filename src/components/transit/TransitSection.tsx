import { searchNearbyTransit } from "@/lib/api/kakao-api"

interface Props {
  lat: number
  lng: number
  locale: string
}

function formatDist(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

export default async function TransitSection({ lat, lng, locale }: Props) {
  const isKo = locale === "ko"

  const subwayStations = await searchNearbyTransit(lat, lng, "SW8")

  return (
    <div>
      <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
        {isKo ? "주변 지하철역" : "Nearby Subway"}
      </h2>

      {subwayStations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isKo ? "근처 지하철 정보가 없습니다." : "No nearby subway stations."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {subwayStations.map((station) => (
            <a
              key={station.id}
              href={station.place_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-[#F9F7EF] px-4 py-3 transition-colors hover:bg-[#FFEDE7]"
            >
              <span className="truncate text-sm font-medium text-[#1B1C1A]">
                🚇 {station.place_name}
              </span>
              <span className="ml-3 shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                {formatDist(Number(station.distance))}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
