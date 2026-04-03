import Image from "next/image"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"
import { getFestivalById, computeStatus, getRegionName } from "@/lib/data/festivals"
import { buildAlternates } from "@/lib/utils/metadata"
import { buildNaverMapUrl } from "@/lib/api/kakao-api"
import ImagePlaceholder from "@/components/shared/ImagePlaceholder"
import TravelMap from "../../travel/_components/TravelMap"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

// ── TourAPI detail helpers ─────────────────────────────────────────────────

const TOUR_BASE = "https://apis.data.go.kr/B551011/KorService2"

function tourParams(contentId: string) {
  const p = new URLSearchParams()
  p.set("serviceKey", process.env.TOUR_API_KEY ?? "")
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
}

async function fetchFestivalDetail(contentId: string): Promise<FestivalDetail> {
  const blank: FestivalDetail = {
    overview: null, tel: null, homepage: null,
    eventplace: null, eventhomepage: null, playtime: null,
    eventprice: null, program: null, bookingplace: null,
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
      overview:      commonItem?.overview    || null,
      tel:           commonItem?.tel         || null,
      homepage:      commonItem?.homepage    || null,
      eventplace:    introItem?.eventplace   || null,
      eventhomepage: introItem?.eventhomepage || null,
      playtime:      introItem?.playtime     || null,
      eventprice:    introItem?.usetimefestival || introItem?.eventprice || null,
      program:       introItem?.program      || null,
      bookingplace:  introItem?.bookingplace || null,
    }
  } catch {
    return blank
  }
}

// ── Page ──────────────────────────────────────────────────────────────────

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const festival = await getFestivalById(id)
  if (!festival) return { title: "행사/이벤트" }
  return {
    title: festival.title,
    alternates: buildAlternates(`/events/${id}`),
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const [festival, detail] = await Promise.all([
    getFestivalById(id),
    fetchFestivalDetail(id),
  ])

  if (!festival) notFound()

  const isKo = locale === "ko"
  const status = computeStatus(festival)
  const statusCfg = STATUS_CONFIG[status]
  const region = getRegionName(festival.areaCode)

  const lat = festival.mapy
  const lng = festival.mapx
  const hasMap = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)

  const venue = detail.eventplace || festival.addr1
  const homepage = detail.eventhomepage || detail.homepage

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Title + status + region */}
      <div className="mb-2 flex flex-wrap items-start gap-3">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
          {festival.title}
        </h1>
        <span
          className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusCfg.className}`}
        >
          {isKo ? statusCfg.ko : statusCfg.en}
        </span>
        {region && (
          <span className="mt-1 inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-[#D84315]">
            {region}
          </span>
        )}
      </div>

      {/* Date range */}
      <p className="mb-6 text-lg font-medium text-[#5A413A]">
        {formatDate(festival.eventStartDate, isKo)} ~ {formatDate(festival.eventEndDate, isKo)}
      </p>

      {/* Image */}
      <div className="mb-6 overflow-hidden rounded-xl">
        {festival.imageUrl ? (
          <div className="relative aspect-video w-full">
            <Image
              src={festival.imageUrl}
              alt={festival.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        ) : (
          <ImagePlaceholder type="festival" fullWidth />
        )}
      </div>

      {/* Core info card */}
      <div className="mb-6 space-y-3 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
        {venue && (
          <div className="flex gap-2 text-sm">
            <span className="w-28 shrink-0 font-medium text-muted-foreground">
              {isKo ? "개최장소" : "Venue"}
            </span>
            <span className="text-foreground">{venue}</span>
          </div>
        )}
        {festival.addr1 && (
          <div className="flex gap-2 text-sm">
            <span className="w-28 shrink-0 font-medium text-muted-foreground">
              {isKo ? "주소" : "Address"}
            </span>
            <span className="text-foreground">{festival.addr1}{festival.addr2 ? ` ${festival.addr2}` : ""}</span>
          </div>
        )}
        {detail.tel && (
          <div className="flex gap-2 text-sm">
            <span className="w-28 shrink-0 font-medium text-muted-foreground">
              {isKo ? "전화" : "Phone"}
            </span>
            <a href={`tel:${detail.tel}`} className="text-[#D84315] hover:underline">
              {detail.tel}
            </a>
          </div>
        )}
        {detail.playtime && (
          <div className="flex gap-2 text-sm">
            <span className="w-28 shrink-0 font-medium text-muted-foreground">
              {isKo ? "공연시간" : "Duration"}
            </span>
            <span className="text-foreground">{detail.playtime}</span>
          </div>
        )}
        {detail.eventprice && (
          <div className="flex gap-2 text-sm">
            <span className="w-28 shrink-0 font-medium text-muted-foreground">
              {isKo ? "이용요금" : "Admission"}
            </span>
            <span className="text-foreground">{detail.eventprice}</span>
          </div>
        )}
        {detail.bookingplace && (
          <div className="flex gap-2 text-sm">
            <span className="w-28 shrink-0 font-medium text-muted-foreground">
              {isKo ? "예매처" : "Booking"}
            </span>
            <span className="text-foreground">{detail.bookingplace}</span>
          </div>
        )}
        {homepage && (
          <div className="flex gap-2 text-sm">
            <span className="w-28 shrink-0 font-medium text-muted-foreground">
              {isKo ? "홈페이지" : "Website"}
            </span>
            <a
              href={homepage.startsWith("http") ? homepage : `https://${homepage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-[#D84315] hover:underline"
            >
              {homepage}
            </a>
          </div>
        )}
      </div>

      {/* Overview / description */}
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

      {/* Program */}
      {detail.program && (
        <div className="mb-6">
          <h2 className="mb-3 font-headline text-xl font-bold text-[#1B1C1A]">
            {isKo ? "행사 프로그램" : "Program"}
          </h2>
          <div
            className="leading-relaxed text-[#5A413A] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: detail.program }}
          />
        </div>
      )}

      {/* Map */}
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
    </div>
  )
}
