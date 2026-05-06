import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"
import { getFestivalById, computeStatus, getRegionName } from "@/lib/data/festivals"
import { getSpecialtiesByRegionName } from "@/lib/data/specialties"
import { getNearbyFacilities } from "@/lib/data/nearby-facilities"
import { getNearbyTourRecommendations } from "@/lib/data/nearby-tour-recommendations"
import { buildAlternates } from "@/lib/utils/metadata"
import NearbyNaverPlaces from "@/components/nearby/NearbyNaverPlaces"
import NearbyTourRecommendationsSection from "@/components/nearby/NearbyTourRecommendations"
import TravelBlogReviewSection from "@/components/travel/TravelBlogReviewSection"
import RecipeRecommendationSection from "@/components/recipes/RecipeRecommendationSection"
import TravelSpecialtiesSection from "@/components/travel/TravelSpecialtiesSection"
import { buildNaverMapUrl } from "@/lib/api/kakao-api"
import TravelMap from "../../travel/_components/TravelMap"
import NearbyFacilities from "../../travel/_components/NearbyFacilities"
import TransitSection from "@/components/transit/TransitSection"
import WeatherWidget from "@/components/weather/WeatherWidget"
import FestivalImageGallery from "../_components/FestivalImageGallery"
import FestivalInfoCards from "../_components/FestivalInfoCards"
import FestivalProgramSection from "../_components/FestivalProgramSection"
import FestivalContactSection from "../_components/FestivalContactSection"
import FestivalShareActions from "../_components/FestivalShareActions"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

// ── TourAPI detail helpers ─────────────────────────────────────────────────

const TOUR_BASE = "https://apis.data.go.kr/B551011/KorService2"

function tourParams(contentId: string) {
  const p = new URLSearchParams()
  p.set("serviceKey", process.env.PUBLIC_DATA_API_KEY ?? "")
  p.set("MobileOS", "ETC")
  p.set("MobileApp", "TripBite")
  p.set("_type", "json")
  p.set("contentId", contentId)
  p.set("contentTypeId", "15")
  return p
}

interface FestivalDetail {
  overview: string | null
  tel: string | null
  homepage: string | null
  eventplace: string | null
  eventhomepage: string | null
  playtime: string | null
  eventprice: string | null
  program: string | null
  bookingplace: string | null
  agelimit: string | null
  spendtimefestival: string | null
  discountinfofestival: string | null
  festivalgrade: string | null
  sponsor1: string | null
  sponsor1tel: string | null
  sponsor2: string | null
  sponsor2tel: string | null
  subevent: string | null
}

async function fetchFestivalDetail(contentId: string): Promise<FestivalDetail> {
  const blank: FestivalDetail = {
    overview: null, tel: null, homepage: null,
    eventplace: null, eventhomepage: null, playtime: null,
    eventprice: null, program: null, bookingplace: null,
    agelimit: null, spendtimefestival: null, discountinfofestival: null,
    festivalgrade: null, sponsor1: null, sponsor1tel: null,
    sponsor2: null, sponsor2tel: null, subevent: null,
  }

  try {
    const [commonRes, introRes] = await Promise.all([
      fetch(`${TOUR_BASE}/detailCommon2?${tourParams(contentId).toString()}&defaultYN=Y&overviewYN=Y`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${TOUR_BASE}/detailIntro2?${tourParams(contentId).toString()}`, {
        next: { revalidate: 3600 },
      }),
    ])

    const [commonJson, introJson] = await Promise.all([
      commonRes.ok ? commonRes.json() : null,
      introRes.ok ? introRes.json() : null,
    ])

    const common = commonJson?.response?.body?.items?.item
    const commonItem = Array.isArray(common) ? common[0] : common

    const intro = introJson?.response?.body?.items?.item
    const introItem = Array.isArray(intro) ? intro[0] : intro

    return {
      overview:             commonItem?.overview         || null,
      tel:                  commonItem?.tel              || null,
      homepage:             commonItem?.homepage         || null,
      eventplace:           introItem?.eventplace        || null,
      eventhomepage:        introItem?.eventhomepage     || null,
      playtime:             introItem?.playtime          || null,
      eventprice:           introItem?.usetimefestival   || introItem?.eventprice || null,
      program:              introItem?.program           || null,
      bookingplace:         introItem?.bookingplace      || null,
      agelimit:             introItem?.agelimit          || null,
      spendtimefestival:    introItem?.spendtimefestival || null,
      discountinfofestival: introItem?.discountinfofestival || null,
      festivalgrade:        introItem?.festivalgrade     || null,
      sponsor1:             introItem?.sponsor1          || null,
      sponsor1tel:          introItem?.sponsor1tel       || null,
      sponsor2:             introItem?.sponsor2          || null,
      sponsor2tel:          introItem?.sponsor2tel       || null,
      subevent:             introItem?.subevent          || null,
    }
  } catch {
    return blank
  }
}

async function fetchFestivalImages(contentId: string): Promise<string[]> {
  try {
    const p = new URLSearchParams()
    p.set("serviceKey", process.env.PUBLIC_DATA_API_KEY ?? "")
    p.set("MobileOS", "ETC")
    p.set("MobileApp", "TripBite")
    p.set("_type", "json")
    p.set("contentId", contentId)
    p.set("imageYN", "Y")
    p.set("subImageYN", "Y")

    const res = await fetch(`${TOUR_BASE}/detailImage2?${p.toString()}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []

    const json = await res.json()
    const items = json?.response?.body?.items?.item
    if (!items) return []
    const arr = Array.isArray(items) ? items : [items]
    return arr
      .map((img: Record<string, string>) => img.originimgurl || img.smallimageurl)
      .filter(Boolean)
  } catch {
    return []
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function addrToAreaCode(province: string): string {
  if (province.includes("서울")) return "11"
  if (province.includes("부산")) return "26"
  if (province.includes("대구")) return "27"
  if (province.includes("인천")) return "28"
  if (province.includes("광주")) return "29"
  if (province.includes("대전")) return "30"
  if (province.includes("울산")) return "31"
  if (province.includes("세종")) return "36"
  if (province.includes("경기")) return "41"
  if (province.includes("강원")) return "42"
  if (province.includes("충북") || province.includes("충청북")) return "43"
  if (province.includes("충남") || province.includes("충청남")) return "44"
  if (province.includes("전북") || province.includes("전라북")) return "45"
  if (province.includes("전남") || province.includes("전라남")) return "46"
  if (province.includes("경북") || province.includes("경상북")) return "47"
  if (province.includes("경남") || province.includes("경상남")) return "48"
  if (province.includes("제주")) return "50"
  return ""
}

const STATUS_CONFIG = {
  ongoing: { ko: "진행중", en: "Ongoing", className: "bg-green-100 text-green-800" },
  upcoming: { ko: "예정", en: "Upcoming", className: "bg-blue-100 text-blue-800" },
  ended: { ko: "종료", en: "Ended", className: "bg-gray-100 text-gray-500" },
}

function formatDate(d: string, isKo: boolean): string {
  if (!d || d.length < 8) return d
  if (isKo) return `${d.slice(0, 4)}년 ${d.slice(4, 6)}월 ${d.slice(6, 8)}일`
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

function computeDDay(
  startDate: string,
  endDate: string,
  status: "ongoing" | "upcoming" | "ended",
  isKo: boolean
): { label: string; urgent: boolean } | null {
  if (status === "ended") return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (status === "upcoming") {
    const start = new Date(
      parseInt(startDate.slice(0, 4)),
      parseInt(startDate.slice(4, 6)) - 1,
      parseInt(startDate.slice(6, 8))
    )
    const diff = Math.round((start.getTime() - today.getTime()) / 86400000)
    if (diff === 0) return { label: isKo ? "오늘 시작!" : "Starts today!", urgent: false }
    return { label: `D-${diff}`, urgent: false }
  }

  // ongoing
  const end = new Date(
    parseInt(endDate.slice(0, 4)),
    parseInt(endDate.slice(4, 6)) - 1,
    parseInt(endDate.slice(6, 8))
  )
  const diff = Math.round((end.getTime() - today.getTime()) / 86400000)
  if (diff <= 0) return { label: isKo ? "오늘 마지막!" : "Last day!", urgent: true }
  if (diff === 1) return { label: isKo ? "내일 종료" : "Ends tomorrow", urgent: true }
  if (diff <= 7) return { label: isKo ? `${diff}일 후 종료` : `${diff}d left`, urgent: true }
  return { label: isKo ? `${diff}일 남음` : `${diff}d left`, urgent: false }
}

interface AtmosphereTag {
  label: string
  color: string
}

function getAtmosphereTags(title: string, overview: string | null, isKo: boolean): AtmosphereTag[] {
  const text = `${title} ${overview ?? ""}`.toLowerCase()
  const tags: AtmosphereTag[] = []

  if (/가족|아이|어린이|키즈|체험|만들기/.test(text))
    tags.push({ label: isKo ? "가족 추천" : "Family", color: "bg-amber-50 text-amber-700 ring-amber-200" })
  if (/야간|야경|불빛|조명|빛축제|야시장|달빛|야외/.test(text))
    tags.push({ label: isKo ? "야간 축제" : "Night Festival", color: "bg-indigo-50 text-indigo-700 ring-indigo-200" })
  if (/먹거리|음식|맛집|미식|음료|맥주|막걸리|요리|식|푸드/.test(text))
    tags.push({ label: isKo ? "먹거리 중심" : "Food Festival", color: "bg-orange-50 text-orange-700 ring-orange-200" })
  if (/연인|커플|데이트|로맨틱|낭만/.test(text))
    tags.push({ label: isKo ? "커플 추천" : "Couples", color: "bg-rose-50 text-rose-700 ring-rose-200" })
  if (/꽃|벚꽃|장미|국화|수국|유채|튤립/.test(text))
    tags.push({ label: isKo ? "꽃 축제" : "Flower Fest", color: "bg-pink-50 text-pink-700 ring-pink-200" })
  if (/불꽃놀이|불꽃/.test(text))
    tags.push({ label: isKo ? "불꽃 축제" : "Fireworks", color: "bg-red-50 text-red-700 ring-red-200" })
  if (/전통|민속|한복|한옥|국악|민요/.test(text))
    tags.push({ label: isKo ? "전통 문화" : "Traditional", color: "bg-yellow-50 text-yellow-700 ring-yellow-200" })
  if (/음악|공연|콘서트|뮤지컬/.test(text))
    tags.push({ label: isKo ? "공연·음악" : "Music", color: "bg-purple-50 text-purple-700 ring-purple-200" })

  return tags.slice(0, 4)
}

// ── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const festival = await getFestivalById(id)
  if (!festival) return { title: "행사/축제" }
  return {
    title: festival.title,
    alternates: buildAlternates(`/events/${id}`),
  }
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function EventDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const [festival, detail, galleryImages] = await Promise.all([
    getFestivalById(id),
    fetchFestivalDetail(id),
    fetchFestivalImages(id),
  ])

  if (!festival) notFound()

  const isKo = locale === "ko"
  const status = computeStatus(festival)
  const statusCfg = STATUS_CONFIG[status]
  const region = getRegionName(festival.areaCode)

  const lat = festival.mapy
  const lng = festival.mapx
  const hasMap = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)

  const provinceFullName = (festival.addr1 ?? "").split(" ")[0]

  const [nearbyFacilities, nearbyTourRecommendations, specialties] = await Promise.all([
    hasMap
      ? getNearbyFacilities(lat!, lng!)
      : Promise.resolve({ toilets: [], wifi: [], parking: [], evStations: [] }),
    hasMap
      ? getNearbyTourRecommendations({
          lat: lat!,
          lng: lng!,
          excludeContentId: id,
          types: ["travel", "accommodation"],
        })
      : Promise.resolve({ travel: [], festival: [], accommodation: [] }),
    provinceFullName
      ? getSpecialtiesByRegionName(provinceFullName, 5)
      : Promise.resolve([]),
  ])

  const venue = detail.eventplace || festival.addr1
  const regionName = (() => {
    const parts = (festival.addr1 ?? "").split(" ").filter(Boolean)
    const sigungu = parts[1]
    if (!sigungu) return null
    return sigungu.replace(/(특별자치시|광역시|특별시|시|군|구)$/, "")
  })()

  // Gallery: prefer API images, fall back to DB image_url
  const images = galleryImages.length > 0
    ? galleryImages
    : festival.imageUrl
    ? [festival.imageUrl]
    : []

  const dday = computeDDay(festival.eventStartDate, festival.eventEndDate, status, isKo)
  const atmosphereTags = getAtmosphereTags(festival.title, detail.overview, isKo)
  const isEndingSoon = dday?.urgent && status === "ongoing"

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="mb-2 flex flex-wrap items-start gap-2">
        {/* Status badge */}
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusCfg.className}`}>
          {isKo ? statusCfg.ko : statusCfg.en}
        </span>

        {/* D-Day badge */}
        {dday && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${
              dday.urgent
                ? "bg-red-100 text-red-700"
                : status === "ongoing"
                ? "bg-green-50 text-green-700"
                : "bg-sky-50 text-sky-700"
            }`}
          >
            {dday.label}
          </span>
        )}

        {/* Region badge */}
        {region && (
          <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-[#D84315]">
            {region}
          </span>
        )}
      </div>

      <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
        {festival.title}
      </h1>

      {/* End-soon warning */}
      {isEndingSoon && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {isKo ? "축제 종료가 임박했습니다! 서둘러 방문하세요." : "Ending soon! Plan your visit now."}
        </div>
      )}

      {/* Date range */}
      <p className="mb-3 text-base font-medium text-[#5A413A]">
        📅 {formatDate(festival.eventStartDate, isKo)} ~ {formatDate(festival.eventEndDate, isKo)}
      </p>

      {/* Venue one-liner */}
      {venue && (
        <p className="mb-4 flex items-center gap-1.5 text-sm text-[#7B5E57]">
          <span>📍</span>
          <span>{venue}</span>
        </p>
      )}

      {/* Atmosphere tags */}
      {atmosphereTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {atmosphereTags.map((tag) => (
            <span
              key={tag.label}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tag.color}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Share / Calendar */}
      <div className="mb-6">
        <FestivalShareActions
          title={festival.title}
          isKo={isKo}
          startDate={festival.eventStartDate}
          endDate={festival.eventEndDate}
          venue={venue}
        />
      </div>

      {/* ── Image Gallery ──────────────────────────────────────────── */}
      <FestivalImageGallery images={images} title={festival.title} />

      {/* ── 축제 한눈에 보기 카드 ──────────────────────────────────── */}
      <FestivalInfoCards
        isKo={isKo}
        addr1={festival.addr1}
        eventplace={detail.eventplace}
        playtime={detail.playtime}
        eventprice={detail.eventprice}
        agelimit={detail.agelimit}
        bookingplace={detail.bookingplace}
        discountinfofestival={detail.discountinfofestival}
        festivalgrade={detail.festivalgrade}
        spendtimefestival={detail.spendtimefestival}
      />

      {/* ── 행사 소개 ──────────────────────────────────────────────── */}
      {detail.overview && (
        <div className="mb-6">
          <h2 className="mb-3 font-headline text-xl font-bold text-[#1B1C1A]">
            {isKo ? "행사 소개" : "About"}
          </h2>
          <div
            className="leading-relaxed text-[#5A413A] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: detail.overview }}
          />
        </div>
      )}

      {/* ── 행사 프로그램 (enhanced) ────────────────────────────────── */}
      <FestivalProgramSection
        isKo={isKo}
        program={detail.program}
        subevent={detail.subevent}
      />

      {/* ── 문의 · 공식 정보 ────────────────────────────────────────── */}
      <FestivalContactSection
        isKo={isKo}
        tel={detail.tel}
        homepage={detail.homepage}
        eventhomepage={detail.eventhomepage}
        sponsor1={detail.sponsor1}
        sponsor1tel={detail.sponsor1tel}
        sponsor2={detail.sponsor2}
        sponsor2tel={detail.sponsor2tel}
      />

      {/* ── 위치 · 지도 ─────────────────────────────────────────────── */}
      {hasMap && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <a
              href={buildNaverMapUrl(festival.title, lat!, lng!)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D84315] px-4 py-2 text-sm font-medium text-white hover:bg-[#B71C1C] transition-colors"
            >
              {isKo ? "네이버 지도 보기" : "Naver Map"}
            </a>
          </div>
          <div className="mb-6">
            <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
              {isKo ? "위치" : "Location"}
            </h2>
            <TravelMap lat={lat!} lng={lng!} title={festival.title} />
          </div>
        </>
      )}

      {/* ── 교통 + 날씨 ─────────────────────────────────────────────── */}
      {(hasMap || provinceFullName) && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
          {hasMap && <TransitSection lat={lat!} lng={lng!} locale={locale} />}
          {provinceFullName && addrToAreaCode(provinceFullName) && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
                {isKo ? "현지 날씨" : "Local Weather"}
              </h2>
              <WeatherWidget areaCode={addrToAreaCode(provinceFullName)} locale={locale} />
            </div>
          )}
        </div>
      )}

      {/* ── 주변 시설 ────────────────────────────────────────────────── */}
      <NearbyFacilities
        locale={locale}
        toilets={nearbyFacilities.toilets}
        wifi={nearbyFacilities.wifi}
        parking={nearbyFacilities.parking}
        evStations={nearbyFacilities.evStations}
      />

      {/* ── 함께 즐기기 (주변여행지 + 근처 가볼 곳 통합) ─────────────── */}
      <div className="mb-2">
        <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">
          {isKo ? "이 축제와 함께 즐기기 좋은 곳" : "Nearby Attractions"}
        </h2>
        <p className="mb-4 text-sm text-[#7B5E57]">
          {isKo ? "주변 여행지, 숙소, 맛집을 함께 탐색해보세요." : "Explore travel spots, accommodation, and restaurants nearby."}
        </p>
      </div>

      <NearbyTourRecommendationsSection
        recommendations={nearbyTourRecommendations}
        tabOrder={["travel", "accommodation"]}
        locale={locale}
      />

      {regionName && <NearbyNaverPlaces regionName={regionName} />}

      {/* ── 여행 후기 ────────────────────────────────────────────────── */}
      <TravelBlogReviewSection placeName={festival.title} regionName={regionName} />

      {/* ── 지역 레시피 추천 ─────────────────────────────────────────── */}
      <RecipeRecommendationSection regionName={regionName} context="festival" locale={locale} />

      {/* ── 이 지역 특산품 ────────────────────────────────────────────── */}
      <TravelSpecialtiesSection specialties={specialties} regionName={regionName} />
    </div>
  )
}
