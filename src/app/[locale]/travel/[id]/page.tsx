import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getDestinationDetail } from "@/lib/data/destinations"
import { buildAlternates } from "@/lib/utils/metadata"
import { getAccessibilityInfo } from "@/lib/data/accessibility"
import Rating from "@/components/shared/Rating"
import ImageGallery from "@/components/shared/ImageGallery"
import ReviewSection from "@/components/reviews/ReviewSection"
import AccessibilityBadge from "@/components/shared/AccessibilityBadge"
import WeatherWidget from "@/components/weather/WeatherWidget"
import TravelMap from "../_components/TravelMap"
import { buildNaverMapUrl } from "@/lib/api/kakao-api"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { detail } = await getDestinationDetail(id)

  if (!detail) {
    return { title: "여행지" }
  }

  return {
    title: detail.title,
    description: detail.overview
      ? detail.overview.replace(/<[^>]*>/g, "").slice(0, 160)
      : undefined,
    openGraph: {
      title: detail.title,
      description: detail.overview
        ? detail.overview.replace(/<[^>]*>/g, "").slice(0, 160)
        : undefined,
      images: detail.firstimage ? [{ url: detail.firstimage }] : [],
    },
    alternates: buildAlternates(`/travel/${id}`),
  }
}

export default async function TravelDetailPage({ params }: Props) {
  const { locale, id } = await params

  setRequestLocale(locale)

  const { destination, detail, intro, images, wiki, kakaoPlace } = await getDestinationDetail(id)

  if (!detail && !destination) {
    notFound()
  }

  const accessibility = destination?.id
    ? await getAccessibilityInfo(destination.id)
    : null

  const isKo = locale === "ko"

  const title = detail?.title ?? destination?.title ?? ""
  const addr1 = detail?.addr1 ?? destination?.addr1 ?? ""
  const addr2 = detail?.addr2 ?? destination?.addr2
  const tel = detail?.tel ?? destination?.tel
  const overview = detail?.overview ?? destination?.overview
  const mapx = detail?.mapx ?? (destination?.mapx !== undefined ? String(destination.mapx) : undefined)
  const mapy = detail?.mapy ?? (destination?.mapy !== undefined ? String(destination.mapy) : undefined)

  const lat = mapy ? parseFloat(mapy) : null
  const lng = mapx ? parseFloat(mapx) : null

  const galleryImages = images.map((img) => ({
    url: img.originimgurl,
    alt: img.imgname,
  }))

  if (galleryImages.length === 0 && (detail?.firstimage || destination?.first_image)) {
    const coverUrl = detail?.firstimage ?? destination?.first_image ?? ""
    galleryImages.push({ url: coverUrl, alt: title })
  }

  const ratingAvg = destination?.rating_avg ?? 0
  const ratingCount = destination?.rating_count ?? 0
  const areaCode = destination?.area_code

  const isWorldHeritage =
    intro?.heritage1 === "1" || intro?.heritage2 === "1" || intro?.heritage3 === "1"

  const heritageLabels: string[] = []
  if (intro?.heritage1 === "1")
    heritageLabels.push(isKo ? "세계문화유산" : "World Cultural Heritage")
  if (intro?.heritage2 === "1")
    heritageLabels.push(isKo ? "세계자연유산" : "World Natural Heritage")
  if (intro?.heritage3 === "1")
    heritageLabels.push(isKo ? "세계기록유산" : "World Documentary Heritage")

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>

      <div className="mb-4 flex items-center gap-3">
        <Rating value={ratingAvg} showValue readonly />
        {ratingCount > 0 && (
          <span className="text-sm text-muted-foreground">
            ({ratingCount.toLocaleString()})
          </span>
        )}
      </div>

      {/* 접근성 뱃지 */}
      {accessibility && (
        accessibility.pet_possible ||
        accessibility.wheelchair ||
        accessibility.foreign_friendly
      ) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {accessibility.pet_possible && <AccessibilityBadge type="pet" />}
          {accessibility.wheelchair && <AccessibilityBadge type="wheelchair" />}
          {accessibility.foreign_friendly && <AccessibilityBadge type="foreign" />}
        </div>
      )}

      {/* 세계유산 뱃지 */}
      {isWorldHeritage && (
        <div className="mb-4 flex flex-wrap gap-2">
          {heritageLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800"
            >
              🏛 {label}
            </span>
          ))}
        </div>
      )}

      {galleryImages.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={galleryImages} />
        </div>
      )}

      {/* 기본 정보 카드 */}
      <div className="mb-6 space-y-3 rounded-xl border p-4">
        {addr1 && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "주소" : "Address"}
            </span>
            <span className="text-foreground">{addr1} {addr2}</span>
          </div>
        )}
        {tel && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "전화" : "Phone"}
            </span>
            <a href={`tel:${tel}`} className="text-primary hover:underline">
              {tel}
            </a>
          </div>
        )}
        {intro?.infocenter && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "문의/안내" : "Info"}
            </span>
            <span className="text-foreground">{intro.infocenter}</span>
          </div>
        )}
        {intro?.usetime && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "이용시간" : "Hours"}
            </span>
            <span className="whitespace-pre-line text-foreground" dangerouslySetInnerHTML={{ __html: intro.usetime }} />
          </div>
        )}
        {intro?.restdate && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "쉬는날" : "Closed"}
            </span>
            <span className="text-foreground" dangerouslySetInnerHTML={{ __html: intro.restdate }} />
          </div>
        )}
        {intro?.useseason && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "이용시기" : "Season"}
            </span>
            <span className="text-foreground">{intro.useseason}</span>
          </div>
        )}
        {intro?.parking && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "주차시설" : "Parking"}
            </span>
            <span className="text-foreground">{intro.parking}</span>
          </div>
        )}
        {intro?.accomcount && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "수용인원" : "Capacity"}
            </span>
            <span className="text-foreground">{intro.accomcount}</span>
          </div>
        )}
        {intro?.chkpet && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "반려동물" : "Pets"}
            </span>
            <span className="text-foreground">{intro.chkpet}</span>
          </div>
        )}
        {intro?.chkbabycarriage && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "유모차 대여" : "Stroller"}
            </span>
            <span className="text-foreground">{intro.chkbabycarriage}</span>
          </div>
        )}
        {intro?.chkcreditcard && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "신용카드" : "Credit Card"}
            </span>
            <span className="text-foreground">{intro.chkcreditcard}</span>
          </div>
        )}
      </div>

      {/* 체험 안내 */}
      {(intro?.expguide || intro?.expagerange) && (
        <div className="mb-6 rounded-xl border p-4">
          <h2 className="mb-3 text-base font-semibold text-foreground">
            {isKo ? "체험 안내" : "Experience Guide"}
          </h2>
          <div className="space-y-2">
            {intro?.expagerange && (
              <div className="flex gap-2 text-sm">
                <span className="w-24 shrink-0 font-medium text-muted-foreground">
                  {isKo ? "체험 연령" : "Age Range"}
                </span>
                <span className="text-foreground">{intro.expagerange}</span>
              </div>
            )}
            {intro?.expguide && (
              <div className="flex gap-2 text-sm">
                <span className="w-24 shrink-0 font-medium text-muted-foreground">
                  {isKo ? "체험 안내" : "Guide"}
                </span>
                <span className="whitespace-pre-line text-foreground">{intro.expguide}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {overview && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "소개" : "Overview"}
          </h2>
          <p
            className="leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: overview }}
          />
        </div>
      )}

      {/* 위키백과 보충 설명 */}
      {wiki && wiki.extract && (
        <div className="mb-6 rounded-xl border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {isKo ? "위키백과" : "Wikipedia"}
            </h2>
            {wiki.content_urls?.desktop?.page && (
              <a
                href={wiki.content_urls.desktop.page}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                {isKo ? "전체 보기" : "Read more"}
              </a>
            )}
          </div>
          <div className="flex items-start gap-3">
            {wiki.thumbnail && (
              <img
                src={wiki.thumbnail.source}
                alt={wiki.title}
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
            )}
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-5">
              {wiki.extract}
            </p>
          </div>
        </div>
      )}

      {/* 지도 바로가기 버튼 */}
      {(kakaoPlace || (lat !== null && lng !== null)) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {kakaoPlace?.place_url && (
            <a
              href={kakaoPlace.place_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-100 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {isKo ? "카카오맵 보기" : "Kakao Map"}
            </a>
          )}
          <a
            href={buildNaverMapUrl(title, lat ?? undefined, lng ?? undefined)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-green-50 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {isKo ? "네이버 지도 보기" : "Naver Map"}
          </a>
        </div>
      )}

      {lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "위치" : "Location"}
          </h2>
          <TravelMap lat={lat} lng={lng} title={title} />
        </div>
      )}

      {areaCode && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "현재 날씨" : "Current Weather"}
          </h2>
          <WeatherWidget areaCode={areaCode} />
        </div>
      )}

      <div className="mb-6">
        <ReviewSection
          targetType="destination"
          targetId={destination?.content_id ?? id}
        />
      </div>
    </div>
  )
}
