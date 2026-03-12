// P4-10~14: 홈페이지 (7개 섹션)

import Link from "next/link"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getDestinations } from "@/lib/data/destinations"
import { getRestaurants } from "@/lib/data/restaurants"
import { getCampingSites } from "@/lib/data/camping"
import { getSpecialties } from "@/lib/data/specialties"
import { getRecipes } from "@/lib/data/recipes"
import { AREA_CODES } from "@/lib/constants/area-codes"
import { getCurrentSeason, getCurrentSeasonLabel, getWeatherRecommendation } from "@/lib/utils/recommendation"
import SearchBar from "@/components/search/SearchBar"
import TravelCard from "@/components/cards/TravelCard"
import RestaurantCard from "@/components/cards/RestaurantCard"
import CampingCard from "@/components/cards/CampingCard"
import SpecialtyCard from "@/components/cards/SpecialtyCard"
import RecipeCard from "@/components/cards/RecipeCard"
import KoreaMapSvg from "@/components/maps/KoreaMapSvg"
import type { Destination } from "@/types/database"
import type { TourSpotBase, RestaurantDetail } from "@/types/tour-api"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Trip Bite - Korea Travel & Food" : "트립바이트 - 한국 여행 & 음식",
    description:
      locale === "en"
        ? "Discover travel destinations, restaurants, camping sites and local specialties across Korea."
        : "한국의 여행지, 맛집, 캠핑장, 특산품을 한눈에 탐색하세요.",
  }
}

// 인기 검색어
const POPULAR_KEYWORDS = ["제주도", "경복궁", "설악산", "부산 해운대", "전주 한옥마을"]

// 대표 지역 코드 (홈 그리드용 8개)
const FEATURED_AREA_CODES = ["1", "31", "32", "6", "39", "36", "37", "38"]

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const season = getCurrentSeason()
  const seasonLabel = getCurrentSeasonLabel()
  const weatherContentTypes = getWeatherRecommendation("1", "0") // 맑음 기본값

  const emptyDest = { items: [] as Destination[], totalCount: 0 }
  const [r0, r1, r2, r3, r4] = await Promise.allSettled([
    getDestinations({ pageSize: 6, sort: "rating" }),
    getSpecialties({ season: seasonLabel, pageSize: 4 }),
    getRecipes({ pageSize: 4 }),
    getCampingSites({ pageSize: 4, sort: "rating" }),
    getDestinations({ contentTypeId: weatherContentTypes[0], pageSize: 4, sort: "rating" }),
  ])
  const featuredDestinations = r0.status === "fulfilled" ? r0.value : emptyDest
  const seasonalSpecialties = r1.status === "fulfilled" ? r1.value : { items: [] as import("@/types/database").SpecialtyRow[], totalCount: 0 }
  const latestRecipes = r2.status === "fulfilled" ? r2.value : { items: [] as import("@/types/database").RecipeRow[], totalCount: 0 }
  const recommendedCamping = r3.status === "fulfilled" ? r3.value : { items: [] as import("@/types/database").CampingSite[], totalCount: 0 }
  const weatherDestinations = r4.status === "fulfilled" ? r4.value : emptyDest

  return (
    <div className="flex flex-col">
      {/* 1. 히어로 섹션 */}
      <section className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
            {locale === "en" ? "Discover Korea" : "한국을 여행하다"}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            {locale === "en"
              ? "Travel destinations, local food and camping across Korea"
              : "전국의 여행지, 맛집, 캠핑장을 한번에"}
          </p>
          <div className="mx-auto max-w-lg">
            <SearchBar
              placeholder={
                locale === "en"
                  ? "Search destinations, camping sites..."
                  : "여행지, 캠핑장을 검색하세요"
              }
            />
          </div>
          {/* 인기 검색어 */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {POPULAR_KEYWORDS.map((keyword) => (
              <Link
                key={keyword}
                href={`/${locale}/search?q=${encodeURIComponent(keyword)}`}
                className="rounded-full border border-border bg-background/80 px-4 py-1.5 text-sm text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {keyword}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. 추천 여행지 캐러셀 */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {locale === "en" ? "Top Destinations" : "추천 여행지"}
            </h2>
            <Link href={`/${locale}/travel`} className="text-sm text-primary hover:underline">
              {locale === "en" ? "View all" : "전체 보기"}
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {featuredDestinations.items.map((item: Destination) => (
              <div key={item.content_id} className="w-52 flex-none md:w-64">
                <TravelCard
                  item={{
                    contentid: item.content_id,
                    title: item.title,
                    addr1: item.addr1,
                    areacode: item.area_code,
                    firstimage: item.first_image,
                  } as TourSpotBase}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 인기 지역 그리드 */}
      <section className="bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            {locale === "en" ? "Explore by Region" : "지역별 탐색"}
          </h2>
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* SVG 지도 */}
            <div className="flex-none md:w-64">
              <KoreaMapSvg className="h-72 w-full" />
            </div>
            {/* 지역 카드 그리드 */}
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              {FEATURED_AREA_CODES.map((code) => {
                const area = AREA_CODES.find((a) => a.code === code)
                if (!area) return null
                const name = locale === "en" ? area.nameEn : area.nameKo
                return (
                  <Link
                    key={code}
                    href={`/${locale}/region/${code}`}
                    className="flex items-center justify-center rounded-lg border border-border bg-background p-4 text-center font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. 제철 특산품 */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {locale === "en" ? `${season} Specialties` : `${seasonLabel} 제철 특산품`}
            </h2>
            <Link href={`/${locale}/specialties`} className="text-sm text-primary hover:underline">
              {locale === "en" ? "View all" : "전체 보기"}
            </Link>
          </div>
          {seasonalSpecialties.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {seasonalSpecialties.items.map((item) => (
                <SpecialtyCard key={item.id} item={item} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {locale === "en" ? "No specialties found." : "등록된 특산품이 없습니다."}
            </p>
          )}
        </div>
      </section>

      {/* 5. 날씨별 추천 */}
      <section className="bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {locale === "en"
                ? `${season} Recommended Destinations`
                : `${seasonLabel} 추천 여행지`}
            </h2>
            <Link href={`/${locale}/travel`} className="text-sm text-primary hover:underline">
              {locale === "en" ? "View all" : "전체 보기"}
            </Link>
          </div>
          {weatherDestinations.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {weatherDestinations.items.map((item: Destination) => (
                <TravelCard
                  key={item.content_id}
                  item={{
                    contentid: item.content_id,
                    title: item.title,
                    addr1: item.addr1,
                    areacode: item.area_code,
                    firstimage: item.first_image,
                  } as TourSpotBase}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {locale === "en" ? "No destinations found." : "추천 여행지가 없습니다."}
            </p>
          )}
        </div>
      </section>

      {/* 6. 최신 레시피 */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {locale === "en" ? "Latest Recipes" : "최신 레시피"}
            </h2>
            <Link href={`/${locale}/recipes`} className="text-sm text-primary hover:underline">
              {locale === "en" ? "View all" : "전체 보기"}
            </Link>
          </div>
          {latestRecipes.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {latestRecipes.items.map((item) => (
                <RecipeCard key={item.id} item={item} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {locale === "en" ? "No recipes found." : "등록된 레시피가 없습니다."}
            </p>
          )}
        </div>
      </section>

      {/* 7. 추천 캠핑장 */}
      <section className="bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {locale === "en" ? "Top Camping Sites" : "추천 캠핑장"}
            </h2>
            <Link href={`/${locale}/camping`} className="text-sm text-primary hover:underline">
              {locale === "en" ? "View all" : "전체 보기"}
            </Link>
          </div>
          {recommendedCamping.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {recommendedCamping.items.map((item) => (
                <CampingCard
                  key={item.content_id}
                  item={{
                    contentId: item.content_id,
                    facltNm: item.faclt_nm,
                    doNm: item.do_nm,
                    sigunguNm: item.sigungu_nm,
                    addr1: item.addr1,
                    firstImageUrl: item.first_image_url,
                  }}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {locale === "en" ? "No camping sites found." : "등록된 캠핑장이 없습니다."}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
