import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { Phone, MapPin, Store, Car, Award } from "lucide-react"

import { getMarketById } from "@/lib/data/markets"
import { getNearbyFacilities } from "@/lib/data/nearby-facilities"
import { getNearbyTourRecommendations } from "@/lib/data/nearby-tour-recommendations"
import { buildAlternates } from "@/lib/utils/metadata"
import { buildNaverMapUrl } from "@/lib/utils/map"

import ShareButton from "@/components/shared/ShareButton"
import NaverMap from "@/components/maps/NaverMap"
import WeatherWidget from "@/components/weather/WeatherWidget"
import TransitSection from "@/components/transit/TransitSection"
import NearbyFacilities from "@/app/[locale]/travel/_components/NearbyFacilities"
import NearbyTourRecommendationsSection from "@/components/nearby/NearbyTourRecommendations"
import NearbyNaverPlaces from "@/components/nearby/NearbyNaverPlaces"
import TravelBlogReviewSection from "@/components/travel/TravelBlogReviewSection"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const market = await getMarketById(id)
  if (!market) return { title: "전통시장" }
  return {
    title: market.mktNm,
    description: [market.mktTpNm, market.rdnAdr].filter(Boolean).join(" · "),
    alternates: buildAlternates(`/markets/${id}`),
  }
}

export default async function MarketDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const market = await getMarketById(id)
  if (!market) notFound()

  const { mktNm, rdnAdr, lnmAdr, sidoNm, sggNm, mktTpNm, parkingYn, telNo,
    lat, lng, itgMktYn, scsflTpNm, storNumber, trtmntPrdlst, estblYear, mrktCycle, areaCd } = market

  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
  const isKo = locale === "ko"

  const addr = rdnAdr ?? lnmAdr ?? [sidoNm, sggNm].filter(Boolean).join(" ")

  // sidoNm → 법정동 area code (날씨 위젯용)
  const SIDO_TO_AREA: Record<string, string> = {
    "서울특별시": "11", "부산광역시": "26", "대구광역시": "27",
    "인천광역시": "28", "광주광역시": "29", "대전광역시": "30",
    "울산광역시": "31", "세종특별자치시": "36110", "경기도": "41",
    "강원도": "51", "강원특별자치도": "51", "충청북도": "43",
    "충청남도": "44", "전라북도": "52", "전북특별자치도": "52",
    "전라남도": "46", "경상북도": "47", "경상남도": "48",
    "제주특별자치도": "50",
  }
  const weatherAreaCode = areaCd ?? (sidoNm ? SIDO_TO_AREA[sidoNm] ?? null : null)

  // 시군구명에서 짧은 지역명 추출 (날씨/블로그 검색용)
  const regionName = sggNm
    ? sggNm.replace(/(특별자치시|광역시|특별시|시|군|구)$/, "")
    : sidoNm ?? null

  const [nearbyFacilities, nearbyTourRecommendations] = await Promise.all([
    hasCoords
      ? getNearbyFacilities(lat!, lng!)
      : Promise.resolve({ toilets: [], wifi: [], parking: [], evStations: [] }),
    hasCoords
      ? getNearbyTourRecommendations({
          lat: lat!,
          lng: lng!,
          excludeContentId: id,
          types: ["festival", "accommodation", "travel", "restaurant"],
        })
      : Promise.resolve({ travel: [], festival: [], accommodation: [], restaurant: [], cafe: [] }),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      {/* 헤더 */}
      <div className="mb-2 flex flex-wrap gap-2">
        {mktTpNm && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {mktTpNm}
          </span>
        )}
        {itgMktYn === "Y" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
            <Award className="w-3 h-3" />
            {isKo ? "인정시장" : "Certified Market"}
          </span>
        )}
        {parkingYn === "Y" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            <Car className="w-3 h-3" />
            {isKo ? "주차 가능" : "Parking"}
          </span>
        )}
      </div>

      <h1 className="mb-3 font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
        {mktNm}
      </h1>

      <div className="mb-2 flex justify-end">
        <ShareButton
          title={mktNm}
          isKo={isKo}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#5A413A] transition hover:border-[#D84315] hover:text-[#D84315]"
        />
      </div>

      {/* 기본 정보 카드 */}
      <div className="mb-6 space-y-3 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
        {addr && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "주소" : "Address"}
            </span>
            <span className="flex items-start gap-1 text-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {addr}
            </span>
          </div>
        )}
        {telNo && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "전화" : "Phone"}
            </span>
            <a href={`tel:${telNo}`} className="flex items-center gap-1 text-[#D84315] hover:underline">
              <Phone className="h-3.5 w-3.5" />
              {telNo}
            </a>
          </div>
        )}
        {storNumber && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "점포수" : "Stores"}
            </span>
            <span className="flex items-center gap-1 text-foreground">
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
              {storNumber}{isKo ? "개" : ""}
            </span>
          </div>
        )}
        {trtmntPrdlst && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "취급품목" : "Products"}
            </span>
            <span className="text-foreground">{trtmntPrdlst}</span>
          </div>
        )}
        {estblYear && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "개설연도" : "Est."}
            </span>
            <span className="text-foreground">{estblYear}{isKo ? "년" : ""}</span>
          </div>
        )}
        {mrktCycle && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "장날" : "Market Day"}
            </span>
            <span className="text-foreground">{mrktCycle}</span>
          </div>
        )}
        {scsflTpNm && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "성공유형" : "Category"}
            </span>
            <span className="text-foreground">{scsflTpNm}</span>
          </div>
        )}
      </div>

      {/* 지도 바로가기 버튼 */}
      {hasCoords && (
        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(mktNm)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFEDE7] px-4 py-2 text-sm font-medium text-[#D84315] hover:bg-[#D84315] hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {isKo ? "카카오맵 보기" : "Kakao Map"}
          </a>
          <a
            href={buildNaverMapUrl(mktNm, lat!, lng!)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D84315] px-4 py-2 text-sm font-medium text-white hover:bg-[#B71C1C] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {isKo ? "네이버 지도 보기" : "Naver Map"}
          </a>
        </div>
      )}

      {/* 지도 */}
      {hasCoords && (
        <div className="mb-6">
          <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
            {isKo ? "위치" : "Location"}
          </h2>
          <NaverMap lat={lat!} lng={lng!} markerTitle={mktNm} showMarker className="relative h-64 w-full overflow-hidden rounded-xl" />
        </div>
      )}

      {/* 지하철 + 날씨 */}
      {hasCoords && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
          <TransitSection lat={lat!} lng={lng!} locale={locale} />
          {weatherAreaCode && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
                {isKo ? "현재 날씨" : "Current Weather"}
              </h2>
              <WeatherWidget areaCode={weatherAreaCode} />
            </div>
          )}
        </div>
      )}

      {/* 주변 편의시설 */}
      <NearbyFacilities
        locale={locale}
        toilets={nearbyFacilities.toilets}
        wifi={nearbyFacilities.wifi}
        parking={nearbyFacilities.parking}
        evStations={nearbyFacilities.evStations}
      />

      {/* 주변 추천 정보 */}
      <NearbyTourRecommendationsSection
        recommendations={nearbyTourRecommendations}
        tabOrder={["festival", "accommodation", "travel", "restaurant"]}
        locale={locale}
      />

      {/* 여행 후기 */}
      <TravelBlogReviewSection placeName={mktNm} regionName={regionName} />

      {/* 이 근처에서 같이 가볼 곳 */}
      {regionName && <NearbyNaverPlaces regionName={regionName} />}

    </div>
  )
}
