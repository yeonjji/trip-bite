import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getBarrierFreePlaceDetail } from "@/lib/data/barrier-free-places"
import { tourApi } from "@/lib/api/tour-api"
import { buildAlternates } from "@/lib/utils/metadata"
import Rating from "@/components/shared/Rating"
import ImageGallery from "@/components/shared/ImageGallery"
import ReviewSection from "@/components/reviews/ReviewSection"
import TravelMap from "../../_components/TravelMap"
import type { TourImage } from "@/types/tour-api"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const place = await getBarrierFreePlaceDetail(id)

  if (!place) return { title: "무장애 여행" }

  return {
    title: place.title,
    description: place.overview
      ? place.overview.replace(/<[^>]*>/g, "").slice(0, 160)
      : undefined,
    openGraph: {
      title: place.title,
      images: place.first_image ? [{ url: place.first_image }] : [],
    },
    alternates: buildAlternates(`/travel/barrier-free/${id}`),
  }
}

interface AccessItem {
  key: keyof typeof ACCESSIBILITY_FIELDS
  labelKo: string
  labelEn: string
  icon: string
}

const ACCESSIBILITY_FIELDS = {
  wheelchair: { labelKo: "휠체어 대여", labelEn: "Wheelchair Rental", icon: "♿" },
  exit_accessible: { labelKo: "출입구 접근", labelEn: "Accessible Entrance", icon: "🚪" },
  restroom_wh: { labelKo: "장애인 화장실", labelEn: "Accessible Restroom", icon: "🚻" },
  elevator: { labelKo: "엘리베이터", labelEn: "Elevator", icon: "🛗" },
  parking_wh: { labelKo: "장애인 주차", labelEn: "Accessible Parking", icon: "🅿️" },
  braileblock: { labelKo: "점자블록", labelEn: "Braille Block", icon: "⠿" },
  signguide: { labelKo: "점자 안내판", labelEn: "Braille Guide", icon: "📋" },
  audioguide: { labelKo: "오디오 가이드", labelEn: "Audio Guide", icon: "🔊" },
} as const

export default async function BarrierFreePlaceDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const place = await getBarrierFreePlaceDetail(id)
  if (!place) notFound()

  let images: TourImage[] = []
  try {
    const imgRes = await tourApi.detailImage(id)
    const imgItems = imgRes.response.body.items
    images = imgItems !== "" ? imgItems.item : []
  } catch {
    images = []
  }

  const galleryImages = images.map((img) => ({
    url: img.originimgurl,
    alt: img.imgname,
  }))
  if (galleryImages.length === 0 && place.first_image) {
    galleryImages.push({ url: place.first_image, alt: place.title })
  }

  const lat = place.mapy ?? null
  const lng = place.mapx ?? null
  const isKo = locale === "ko"

  const accessItems: AccessItem[] = (
    Object.keys(ACCESSIBILITY_FIELDS) as (keyof typeof ACCESSIBILITY_FIELDS)[]
  ).map((key) => ({ key, ...ACCESSIBILITY_FIELDS[key] }))

  const hasAccessibility = accessItems.some((item) => !!place[item.key])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-1 text-sm text-muted-foreground">
        <a href={`/${locale}/travel/barrier-free`} className="hover:underline">
          {isKo ? "무장애 여행" : "Barrier-Free Travel"}
        </a>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-foreground">{place.title}</h1>

      <div className="mb-4 flex items-center gap-3">
        <Rating value={place.rating_avg} showValue readonly />
        {place.rating_count > 0 && (
          <span className="text-sm text-muted-foreground">
            ({place.rating_count.toLocaleString()})
          </span>
        )}
      </div>

      {galleryImages.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={galleryImages} />
        </div>
      )}

      <div className="mb-6 flex flex-col gap-2 text-sm text-muted-foreground">
        {place.addr1 && (
          <p>
            <span className="font-medium text-foreground">
              {isKo ? "주소" : "Address"}
            </span>{" "}
            {place.addr1} {place.addr2}
          </p>
        )}
        {place.tel && (
          <p>
            <span className="font-medium text-foreground">
              {isKo ? "전화" : "Phone"}
            </span>{" "}
            <a href={`tel:${place.tel}`} className="hover:underline">
              {place.tel}
            </a>
          </p>
        )}
      </div>

      {/* 접근성 정보 */}
      {hasAccessibility && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-3 text-base font-semibold text-blue-800">
            ♿ {isKo ? "접근성 정보" : "Accessibility Info"}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {accessItems.map(({ key, labelKo, labelEn, icon }) => {
              const value = place[key]
              if (!value) return null
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <span>{icon}</span>
                  <div>
                    <p className="font-medium text-blue-900">
                      {isKo ? labelKo : labelEn}
                    </p>
                    <p className="text-xs text-blue-700 line-clamp-2">{value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {place.overview && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "소개" : "Overview"}
          </h2>
          <p
            className="leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: place.overview }}
          />
        </div>
      )}

      {lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "위치" : "Location"}
          </h2>
          <TravelMap lat={lat} lng={lng} title={place.title} />
        </div>
      )}

      <div className="mb-6">
        <ReviewSection targetType="destination" targetId={place.content_id} />
      </div>
    </div>
  )
}
