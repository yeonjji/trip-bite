import { getNearbySubway } from "@/lib/data/subway"
import { formatDistanceM } from "@/lib/utils/haversine"

interface Props {
  lat: number
  lng: number
  locale: string
}

function buildKakaoMapUrl(stationName: string, lat: number, lng: number) {
  return `https://map.kakao.com/?q=${encodeURIComponent(stationName)}&urlX=${lng}&urlY=${lat}`
}

export default async function TransitSection({ lat, lng, locale }: Props) {
  const isKo = locale === "ko"
  const stations = await getNearbySubway(lat, lng)

  return (
    <div>
      <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
        {isKo ? "주변 지하철역" : "Nearby Subway"}
      </h2>

      {stations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isKo ? "근처 지하철 정보가 없습니다." : "No nearby subway stations."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {stations.map((station) => (
            <a
              key={station.station_id}
              href={buildKakaoMapUrl(station.station_name, station.lat, station.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-[#F9F7EF] px-4 py-3 transition-colors hover:bg-[#FFEDE7]"
            >
              <span className="truncate text-sm font-medium text-[#1B1C1A]">
                🚇 {station.station_name}
                {station.line_name && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({station.line_name})
                  </span>
                )}
              </span>
              <span className="ml-3 shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                {formatDistanceM(station.distance_m)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
