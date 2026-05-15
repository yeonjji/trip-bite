import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

export const revalidate = 3600

import { Suspense } from "react"
import { getDestinationShell } from "@/lib/data/destinations"
import { buildAlternates } from "@/lib/utils/metadata"
import { getAccessibilityInfo } from "@/lib/data/accessibility"
import Rating from "@/components/shared/Rating"
import ImageGallery from "@/components/shared/ImageGallery"
import ShareButton from "@/components/shared/ShareButton"
import ReviewSection from "@/components/reviews/ReviewSection"
import AccessibilityBadge from "@/components/shared/AccessibilityBadge"
import WeatherWidget from "@/components/weather/WeatherWidget"
import NaverMap from "@/components/maps/NaverMap"
import { buildNaverMapUrl } from "@/lib/utils/map"
import NearbyNaverPlaces from "@/components/nearby/NearbyNaverPlaces"
import TravelBlogReviewSection from "@/components/travel/TravelBlogReviewSection"
import RecipeRecommendationSection from "@/components/recipes/RecipeRecommendationSection"
import TransitSection from "@/components/transit/TransitSection"
import TravelTipSection from "@/components/travel/TravelTipSection"
import PetInfoSection from "@/components/travel/PetInfoSection"
import IntroSection from "@/components/travel/IntroSection"
import IntroSkeleton from "@/components/travel/IntroSkeleton"
import KakaoLinkSection from "@/components/travel/KakaoLinkSection"
import NearbyFacilitiesSection from "@/components/nearby/NearbyFacilitiesSection"
import NearbyFacilitiesSkeleton from "@/components/nearby/NearbyFacilitiesSkeleton"
import NearbyShopsSection from "@/components/nearby/NearbyShopsSection"
import NearbyShopsSkeleton from "@/components/nearby/NearbyShopsSkeleton"
import NearbyTourSection from "@/components/nearby/NearbyTourSection"
import NearbyTourSkeleton from "@/components/nearby/NearbyTourSkeleton"
import NearbyRestaurantsSection from "@/components/nearby/NearbyRestaurantsSection"
import NearbyRestaurantsSkeleton from "@/components/nearby/NearbyRestaurantsSkeleton"
import SpecialtiesSection from "@/components/travel/SpecialtiesSection"
import SpecialtiesSkeleton from "@/components/travel/SpecialtiesSkeleton"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { detail, petPlace } = await getDestinationShell(id)

  if (!detail) {
    return { title: "여행지" }
  }

  const baseDescription = detail.overview
    ? detail.overview.replace(/<[^>]*>/g, "").slice(0, 120)
    : undefined

  const petTitle = petPlace ? `${detail.title} - 반려동물 동반 가능 여행지` : detail.title
  const petDescription = petPlace
    ? `${detail.title}의 반려동물 동반 가능 여부, 동반 구분, 크기 제한, 추가 요금 등 강아지와 함께 방문하기 전 확인할 정보를 제공합니다.${baseDescription ? ` ${baseDescription}` : ""}`
    : baseDescription

  return {
    title: petTitle,
    description: petDescription,
    openGraph: {
      title: petTitle,
      description: petDescription,
      images: detail.firstimage ? [{ url: detail.firstimage }] : [],
    },
    alternates: buildAlternates(`/travel/${id}`),
  }
}

export default async function TravelDetailPage({ params }: Props) {
  const { locale, id } = await params

  setRequestLocale(locale)

  const { destination, detail, petPlace, barrierFreePlace } = await getDestinationShell(id)

  const fallback = petPlace ?? barrierFreePlace ?? null

  if (!detail && !destination && !fallback) {
    notFound()
  }

  const accessibility = destination?.id
    ? await getAccessibilityInfo(destination.id)
    : null

  const isKo = locale === "ko"

  const title = detail?.title ?? destination?.title ?? fallback?.title ?? ""
  const addr1 = detail?.addr1 ?? destination?.addr1 ?? fallback?.addr1 ?? ""
  const addr2 = detail?.addr2 ?? destination?.addr2 ?? fallback?.addr2
  const tel = detail?.tel ?? destination?.tel ?? fallback?.tel
  const overview = detail?.overview ?? destination?.overview ?? fallback?.overview
  const mapx = detail?.mapx ?? (destination?.mapx != null ? String(destination.mapx) : undefined) ?? (fallback?.mapx != null ? String(fallback.mapx) : undefined)
  const mapy = detail?.mapy ?? (destination?.mapy != null ? String(destination.mapy) : undefined) ?? (fallback?.mapy != null ? String(fallback.mapy) : undefined)

  const lat = mapy ? parseFloat(mapy) : null
  const lng = mapx ? parseFloat(mapx) : null

  const hasCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)

  const provinceFullName = addr1.split(" ")[0] ?? ""

  const galleryImages: { url: string; alt: string }[] = []
  const coverUrl = detail?.firstimage ?? destination?.first_image ?? fallback?.first_image
  if (coverUrl) {
    galleryImages.push({ url: coverUrl, alt: title })
  }

  const ratingAvg = destination?.rating_avg ?? fallback?.rating_avg ?? 0
  const ratingCount = destination?.rating_count ?? fallback?.rating_count ?? 0
  const areaCode = destination?.area_code

  // 주소에서 시군구명 추출 (예: "강원특별자치도 강릉시 ..." → "강릉")
  const regionName = (() => {
    const parts = addr1.split(" ").filter(Boolean)
    const sigungu = parts[1]
    if (!sigungu) return null
    return sigungu.replace(/(특별자치시|광역시|특별시|시|군|구)$/, "")
  })()

  const contentTypeId = destination?.content_type_id ?? detail?.contenttypeid ?? "12"

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">{title}</h1>

      <div className="mb-4 flex items-center gap-3">
        <Rating value={ratingAvg} showValue readonly />
        {ratingCount > 0 && (
          <span className="text-sm text-[#5A413A]">
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

      <div className="mb-2 flex justify-end">
        <ShareButton
          title={title}
          isKo={isKo}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#5A413A] transition hover:border-[#D84315] hover:text-[#D84315]"
        />
      </div>
      {galleryImages.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={galleryImages} />
        </div>
      )}

      {/* 기본 정보 카드 — shell 전용 (주소/전화/접근성) */}
      {(addr1 || tel || barrierFreePlace) && (
        <div className="mb-6 space-y-3 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
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
              <a href={`tel:${tel}`} className="text-[#D84315] hover:underline">
                {tel}
              </a>
            </div>
          )}
          {barrierFreePlace && (
            <>
              {barrierFreePlace.wheelchair && (
                <div className="flex gap-2 text-sm">
                  <span className="w-24 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "휠체어 대여" : "Wheelchair"}
                  </span>
                  <span className="text-foreground">♿ {barrierFreePlace.wheelchair}</span>
                </div>
              )}
              {barrierFreePlace.exit_accessible && (
                <div className="flex gap-2 text-sm">
                  <span className="w-24 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "출입구 접근" : "Entrance"}
                  </span>
                  <span className="text-foreground">🚪 {barrierFreePlace.exit_accessible}</span>
                </div>
              )}
              {barrierFreePlace.restroom_wh && (
                <div className="flex gap-2 text-sm">
                  <span className="w-24 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "장애인 화장실" : "Restroom"}
                  </span>
                  <span className="text-foreground">🚻 {barrierFreePlace.restroom_wh}</span>
                </div>
              )}
              {barrierFreePlace.elevator && (
                <div className="flex gap-2 text-sm">
                  <span className="w-24 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "엘리베이터" : "Elevator"}
                  </span>
                  <span className="text-foreground">🛗 {barrierFreePlace.elevator}</span>
                </div>
              )}
              {barrierFreePlace.parking_wh && (
                <div className="flex gap-2 text-sm">
                  <span className="w-24 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "장애인 주차" : "Parking"}
                  </span>
                  <span className="text-foreground">🅿️ {barrierFreePlace.parking_wh}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 운영시간/체험/세계유산 등 부가 정보 (TourAPI detailIntro 의존) */}
      <Suspense fallback={<IntroSkeleton />}>
        <IntroSection contentId={id} contentTypeId={contentTypeId} isKo={isKo} />
      </Suspense>

      {/* 반려동물 동반 정보 */}
      {petPlace && (
        <PetInfoSection petPlace={petPlace} petTourInfo={null} isKo={isKo} />
      )}

      {overview && (
        <div className="mb-6">
          <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
            {isKo ? "소개" : "Overview"}
          </h2>
          <p
            className="leading-relaxed text-[#5A413A]"
            dangerouslySetInnerHTML={{ __html: overview }}
          />
        </div>
      )}

      {/* 지도 바로가기 버튼 */}
      {hasCoords && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Suspense fallback={null}>
            <KakaoLinkSection title={title} lat={lat!} lng={lng!} isKo={isKo} />
          </Suspense>
          <a
            href={buildNaverMapUrl(title, lat ?? undefined, lng ?? undefined)}
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

      {hasCoords && (
        <div className="mb-6">
          <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
            {isKo ? "위치" : "Location"}
          </h2>
          <NaverMap lat={lat!} lng={lng!} markerTitle={title} showMarker className="relative h-64 w-full overflow-hidden rounded-xl" />
        </div>
      )}

      {(hasCoords || areaCode) && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
          {hasCoords && <TransitSection lat={lat!} lng={lng!} locale={locale} />}
          {areaCode && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
                {isKo ? "현재 날씨" : "Current Weather"}
              </h2>
              <WeatherWidget areaCode={areaCode} />
            </div>
          )}
        </div>
      )}

      {/* 관광 빅데이터 기반 방문 팁 */}
      <TravelTipSection signguCode={destination?.sigungu_code} />

      {/* 주변 편의시설 */}
      {hasCoords && (
        <Suspense fallback={<NearbyFacilitiesSkeleton />}>
          <NearbyFacilitiesSection lat={lat!} lng={lng!} locale={locale} />
        </Suspense>
      )}

      {/* 주변 생활 편의 */}
      {hasCoords && (
        <Suspense fallback={<NearbyShopsSkeleton />}>
          <NearbyShopsSection lat={lat!} lng={lng!} isKo={isKo} />
        </Suspense>
      )}

      {/* 주변 추천 정보 */}
      {hasCoords && (
        <Suspense fallback={<NearbyTourSkeleton />}>
          <NearbyTourSection
            lat={lat!}
            lng={lng!}
            excludeContentId={id}
            tabOrder={["festival", "accommodation", "travel"]}
            locale={locale}
          />
        </Suspense>
      )}

      {/* 여행 후기 */}
      <TravelBlogReviewSection placeName={title} regionName={regionName} />

      {/* 지역 레시피 추천 */}
      <Suspense fallback={null}>
        <RecipeRecommendationSection regionName={regionName} context="travel" locale={locale} />
      </Suspense>

      {/* 이 지역 특산품 */}
      {provinceFullName && (
        <Suspense fallback={<SpecialtiesSkeleton />}>
          <SpecialtiesSection
            regionFullName={provinceFullName}
            regionName={regionName}
            limit={5}
          />
        </Suspense>
      )}

      {/* 근처 맛집 */}
      {hasCoords && (
        <Suspense fallback={<NearbyRestaurantsSkeleton />}>
          <NearbyRestaurantsSection
            lat={lat!}
            lng={lng!}
            excludeContentId={id}
            locale={locale}
            isKo={isKo}
          />
        </Suspense>
      )}

      {/* 이 근처에서 같이 가볼 곳 */}
      {regionName && <NearbyNaverPlaces regionName={regionName} />}

      <div className="mb-6">
        <ReviewSection
          targetType="destination"
          targetId={destination?.content_id ?? id}
        />
      </div>
    </div>
  )
}
