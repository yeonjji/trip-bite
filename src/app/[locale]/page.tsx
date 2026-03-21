// P4-10~14: 홈페이지 (7개 섹션)

import Link from "next/link"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getDestinations } from "@/lib/data/destinations"
import { getRestaurants } from "@/lib/data/restaurants"
import { getCampingSites } from "@/lib/data/camping"
import { getSpecialties } from "@/lib/data/specialties"
import { getRecipes } from "@/lib/data/recipes"
import { getCurrentSeason, getCurrentSeasonLabel, getWeatherRecommendation } from "@/lib/utils/recommendation"
import { buildAlternates } from "@/lib/utils/metadata"
import SearchBar from "@/components/search/SearchBar"
import TravelCard from "@/components/cards/TravelCard"
import RestaurantCard from "@/components/cards/RestaurantCard"
import CampingCard from "@/components/cards/CampingCard"
import SpecialtyCard from "@/components/cards/SpecialtyCard"
import RecipeCard from "@/components/cards/RecipeCard"
import RegionExplorer from "@/components/home/RegionExplorer"
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
    alternates: buildAlternates(""),
  }
}

// 인기 검색어
const POPULAR_KEYWORDS = ["제주도", "경복궁", "설악산", "부산 해운대", "전주 한옥마을"]


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
      <section className="relative min-h-[580px] bg-[#1B1C1A] flex items-center justify-center px-4 py-20 text-center overflow-hidden">
        {/* 따뜻한 그라디언트 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#D84315]/40 via-[#8B3A2A]/20 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-2xl">
          <h1 className="mb-4 font-headline text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            {locale === "en" ? "Discover Korea" : "대한민국 여행,\n한 입에 담다"}
          </h1>
          <p className="mb-8 text-lg text-white/70">
            {locale === "en"
              ? "Travel destinations, local food and camping across Korea"
              : "전국의 여행지, 맛집, 캠핑장을 한번에"}
          </p>
          <div className="mx-auto max-w-lg">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 warm-shadow">
              <SearchBar
                placeholder={
                  locale === "en"
                    ? "Search destinations, camping sites..."
                    : "여행지, 캠핑장을 검색하세요"
                }
              />
            </div>
          </div>
          {/* 인기 검색어 */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {POPULAR_KEYWORDS.map((keyword) => (
              <Link
                key={keyword}
                href={`/${locale}/search?q=${encodeURIComponent(keyword)}`}
                className="rounded-full bg-white/15 px-4 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/25"
              >
                {keyword}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. 추천 여행지 캐러셀 */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#D84315]">
                {locale === "en" ? "Featured" : "추천"}
              </p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
                {locale === "en" ? "Top Destinations" : "추천 여행지"}
              </h2>
            </div>
            <Link href={`/${locale}/travel`} className="text-sm text-[#D84315] hover:underline shrink-0">
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
      <div className="bg-[#F9F7EF]">
        <RegionExplorer locale={locale} />
      </div>

      {/* 4. 제철 특산품 */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#D84315]">
                {locale === "en" ? "In Season" : "제철"}
              </p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
                {locale === "en" ? `${season} Specialties` : `${seasonLabel} 제철 특산품`}
              </h2>
            </div>
            <Link href={`/${locale}/specialties`} className="text-sm text-[#D84315] hover:underline shrink-0">
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
            <p className="text-sm text-[#5A413A]">
              {locale === "en" ? "No specialties found." : "등록된 특산품이 없습니다."}
            </p>
          )}
        </div>
      </section>

      {/* 5. 날씨별 추천 */}
      <section className="bg-[#F9F7EF] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#D84315]">
                {locale === "en" ? "Seasonal Picks" : "계절 추천"}
              </p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
                {locale === "en"
                  ? `${season} Recommended`
                  : `${seasonLabel} 추천 여행지`}
              </h2>
            </div>
            <Link href={`/${locale}/travel`} className="text-sm text-[#D84315] hover:underline shrink-0">
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
            <p className="text-sm text-[#5A413A]">
              {locale === "en" ? "No destinations found." : "추천 여행지가 없습니다."}
            </p>
          )}
        </div>
      </section>

      {/* 6. 최신 레시피 */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#D84315]">
                {locale === "en" ? "Cook It" : "요리"}
              </p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
                {locale === "en" ? "Latest Recipes" : "최신 레시피"}
              </h2>
            </div>
            <Link href={`/${locale}/recipes`} className="text-sm text-[#D84315] hover:underline shrink-0">
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
            <p className="text-sm text-[#5A413A]">
              {locale === "en" ? "No recipes found." : "등록된 레시피가 없습니다."}
            </p>
          )}
        </div>
      </section>

      {/* 7. 추천 캠핑장 */}
      <section className="bg-[#F9F7EF] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#D84315]">
                {locale === "en" ? "Outdoors" : "캠핑"}
              </p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
                {locale === "en" ? "Top Camping Sites" : "추천 캠핑장"}
              </h2>
            </div>
            <Link href={`/${locale}/camping`} className="text-sm text-[#D84315] hover:underline shrink-0">
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
            <p className="text-sm text-[#5A413A]">
              {locale === "en" ? "No camping sites found." : "등록된 캠핑장이 없습니다."}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
