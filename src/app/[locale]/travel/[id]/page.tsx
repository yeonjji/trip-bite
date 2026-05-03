import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getDestinationDetail } from "@/lib/data/destinations"
import { getNearbyRestaurants } from "@/lib/data/restaurants"
import { getSpecialtiesByRegionName } from "@/lib/data/specialties"
import { getNearbyFacilities } from "@/lib/data/nearby-facilities"
import { getNearbyTourRecommendations } from "@/lib/data/nearby-tour-recommendations"
import { buildAlternates } from "@/lib/utils/metadata"
import HorizontalScrollSection from "@/components/shared/HorizontalScrollSection"
import { getAreaName } from "@/lib/constants/area-codes"
import { getAccessibilityInfo } from "@/lib/data/accessibility"
import Rating from "@/components/shared/Rating"
import ImageGallery from "@/components/shared/ImageGallery"
import ReviewSection from "@/components/reviews/ReviewSection"
import AccessibilityBadge from "@/components/shared/AccessibilityBadge"
import WeatherWidget from "@/components/weather/WeatherWidget"
import TravelMap from "../_components/TravelMap"
import NearbyFacilities from "../_components/NearbyFacilities"
import { buildNaverMapUrl } from "@/lib/api/kakao-api"
import NearbyNaverPlaces from "@/components/nearby/NearbyNaverPlaces"
import NearbyTourRecommendationsSection from "@/components/nearby/NearbyTourRecommendations"
import TravelBlogReviewSection from "@/components/travel/TravelBlogReviewSection"
import RecipeRecommendationSection from "@/components/recipes/RecipeRecommendationSection"
import TravelSpecialtiesSection from "@/components/travel/TravelSpecialtiesSection"
import TransitSection from "@/components/transit/TransitSection"

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

  const { destination, detail, intro, images, wiki, kakaoPlace, petPlace, barrierFreePlace } = await getDestinationDetail(id)

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
  const mapx = detail?.mapx ?? (destination?.mapx !== undefined ? String(destination.mapx) : undefined) ?? (fallback?.mapx !== undefined ? String(fallback.mapx) : undefined)
  const mapy = detail?.mapy ?? (destination?.mapy !== undefined ? String(destination.mapy) : undefined) ?? (fallback?.mapy !== undefined ? String(fallback.mapy) : undefined)

  const lat = mapy ? parseFloat(mapy) : null
  const lng = mapx ? parseFloat(mapx) : null

  const hasCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)

  const provinceFullName = addr1.split(" ")[0] ?? ""

  const [nearbyRestaurants, nearbyFacilities, specialties, nearbyTourRecommendations] = await Promise.all([
    hasCoords ? getNearbyRestaurants(lat!, lng!, id) : Promise.resolve([]),
    hasCoords ? getNearbyFacilities(lat!, lng!) : Promise.resolve({ toilets: [], wifi: [], parking: [], evStations: [] }),
    provinceFullName ? getSpecialtiesByRegionName(provinceFullName, 5) : Promise.resolve([]),
    hasCoords
      ? getNearbyTourRecommendations({
          lat: lat!,
          lng: lng!,
          excludeContentId: id,
          types: ["festival", "accommodation", "travel"],
        })
      : Promise.resolve({ travel: [], festival: [], accommodation: [] }),
  ])

  const galleryImages = images.map((img) => ({
    url: img.originimgurl,
    alt: img.imgname,
  }))

  if (galleryImages.length === 0 && (detail?.firstimage || destination?.first_image || fallback?.first_image)) {
    const coverUrl = detail?.firstimage ?? destination?.first_image ?? fallback?.first_image ?? ""
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
        {petPlace && (
          <>
            {petPlace.pet_acmpny_cl && (
              <div className="flex gap-2 text-sm">
                <span className="w-24 shrink-0 font-medium text-muted-foreground">
                  {isKo ? "반려동물 동반" : "Pet Area"}
                </span>
                <span className="text-foreground">
                  🐾 {({"1": "실내", "2": "실외", "3": "실내외"} as Record<string, string>)[petPlace.pet_acmpny_cl] ?? petPlace.pet_acmpny_cl}
                </span>
              </div>
            )}
            {petPlace.acmpny_type_cd && (
              <div className="flex gap-2 text-sm">
                <span className="w-24 shrink-0 font-medium text-muted-foreground">
                  {isKo ? "동반 동물" : "Pet Types"}
                </span>
                <span className="text-foreground">{petPlace.acmpny_type_cd}</span>
              </div>
            )}
            {petPlace.rel_pet_info && (
              <div className="flex gap-2 text-sm">
                <span className="w-24 shrink-0 font-medium text-muted-foreground">
                  {isKo ? "반려동물 안내" : "Pet Info"}
                </span>
                <span className="text-foreground">{petPlace.rel_pet_info}</span>
              </div>
            )}
          </>
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
        <div className="mb-6 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
          <h2 className="mb-3 font-headline text-base font-bold text-[#1B1C1A]">
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
          <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
            {isKo ? "소개" : "Overview"}
          </h2>
          <p
            className="leading-relaxed text-[#5A413A]"
            dangerouslySetInnerHTML={{ __html: overview }}
          />
        </div>
      )}

      {/* 위키백과 보충 설명 */}
      {wiki && wiki.extract && (
        <div className="mb-6 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-headline text-base font-bold text-[#1B1C1A]">
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
            <p className="text-sm leading-relaxed text-[#5A413A] line-clamp-5">
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFEDE7] px-4 py-2 text-sm font-medium text-[#D84315] hover:bg-[#D84315] hover:text-white transition-colors"
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D84315] px-4 py-2 text-sm font-medium text-white hover:bg-[#B71C1C] transition-colors"
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
          <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
            {isKo ? "위치" : "Location"}
          </h2>
          <TravelMap lat={lat} lng={lng} title={title} />
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

      {/* 주변 추천 정보 */}
      <NearbyTourRecommendationsSection
        recommendations={nearbyTourRecommendations}
        tabOrder={["festival", "accommodation", "travel"]}
        locale={locale}
      />

      {/* 여행 후기 */}
      <TravelBlogReviewSection placeName={title} regionName={regionName} />

      {/* 지역 레시피 추천 */}
      <RecipeRecommendationSection regionName={regionName} context="travel" locale={locale} />

      {/* 이 지역 특산품 */}
      <TravelSpecialtiesSection specialties={specialties} regionName={regionName} />

      {/* 주변 편의시설 */}
      <NearbyFacilities
        locale={locale}
        toilets={nearbyFacilities.toilets}
        wifi={nearbyFacilities.wifi}
        parking={nearbyFacilities.parking}
        evStations={nearbyFacilities.evStations}
      />

      {/* 근처 맛집 */}
      {nearbyRestaurants.length > 0 && (
        <HorizontalScrollSection
          title={isKo ? "근처 맛집" : "Nearby Restaurants"}
          moreHref={`/${locale}/restaurants`}
          moreLabel={isKo ? "맛집 전체" : "All Restaurants"}
          items={nearbyRestaurants.map((r) => ({
            href: `/${locale}/restaurants/${r.content_id}`,
            imageUrl: r.first_image,
            imagePlaceholder: "🍽",
            tag: getAreaName(r.area_code ?? ""),
            title: r.title,
            sub: r.addr1,
          }))}
        />
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
