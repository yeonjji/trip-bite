import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { buildAlternates } from "@/lib/utils/metadata"
import SearchBar from "@/components/search/SearchBar"
import TravelCard from "@/components/cards/TravelCard"
import CampingCard from "@/components/cards/CampingCard"
import RestaurantCard from "@/components/cards/RestaurantCard"
import FestivalCard from "@/components/cards/FestivalCard"
import RecipeCard from "@/components/cards/RecipeCard"
import EmptyState from "@/components/shared/EmptyState"
import type { Destination, CampingSite, RecipeRow } from "@/types/database"
import type { TourSpotBase, RestaurantDetail } from "@/types/tour-api"
import type { CampingSiteBase } from "@/types/camping"
import type { FestivalItem } from "@/types/festival"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; type?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" 검색 결과` : "검색",
    description: q ? `"${q}"에 대한 검색 결과입니다.` : "여행지, 캠핑장, 맛집, 축제, 레시피를 검색하세요.",
    alternates: buildAlternates("/search"),
  }
}

function destinationToSpotBase(d: Destination): TourSpotBase {
  return {
    contentid: d.content_id,
    contenttypeid: d.content_type_id,
    title: d.title,
    addr1: d.addr1,
    addr2: d.addr2,
    areacode: d.area_code,
    sigungucode: d.sigungu_code,
    mapx: d.mapx !== undefined ? String(d.mapx) : undefined,
    mapy: d.mapy !== undefined ? String(d.mapy) : undefined,
    firstimage: d.first_image,
    firstimage2: d.first_image2,
    tel: d.tel,
  }
}

function destinationToRestaurant(d: Destination): RestaurantDetail {
  return {
    contentid: d.content_id,
    contenttypeid: d.content_type_id,
    title: d.title,
    addr1: d.addr1 ?? "",
    addr2: d.addr2,
    areacode: d.area_code ?? "",
    sigungucode: d.sigungu_code,
    firstimage: d.first_image ?? "",
  }
}

function siteToCampingBase(s: CampingSite): CampingSiteBase {
  return {
    contentId: s.content_id,
    facltNm: s.faclt_nm,
    doNm: s.do_nm,
    sigunguNm: s.sigungu_nm,
    addr1: s.addr1,
    addr2: s.addr2,
    mapX: s.mapx !== undefined ? String(s.mapx) : undefined,
    mapY: s.mapy !== undefined ? String(s.mapy) : undefined,
    tel: s.tel,
    homepage: s.homepage,
    firstImageUrl: s.first_image_url,
    lineIntro: s.line_intro,
  }
}

function rowToFestivalItem(row: Record<string, unknown>): FestivalItem {
  return {
    contentId: row.content_id as string,
    title: row.title as string,
    imageUrl: (row.image_url as string) || null,
    addr1: (row.addr1 as string) || "",
    addr2: (row.addr2 as string) || null,
    areaCode: (row.area_code as string) || "",
    sigunguCode: (row.sigungu_code as string) || null,
    mapx: row.mapx != null ? Number(row.mapx) : null,
    mapy: row.mapy != null ? Number(row.mapy) : null,
    eventStartDate: (row.event_start_date as string) || "",
    eventEndDate: (row.event_end_date as string) || "",
  }
}

const LIMIT = 12

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { q } = await searchParams

  setRequestLocale(locale)

  const query = q?.trim() ?? ""

  let destinations: Destination[] = []
  let restaurants: Destination[] = []
  let campingSites: CampingSite[] = []
  let festivals: FestivalItem[] = []
  let recipes: RecipeRow[] = []

  if (query) {
    const supabase = await createClient()
    const pattern = `%${query}%`

    const [destResult, restaurantResult, campResult, festivalResult, recipeResult] =
      await Promise.allSettled([
        supabase
          .from("destinations")
          .select("*")
          .ilike("title", pattern)
          .neq("content_type_id", "39")
          .limit(LIMIT),
        supabase
          .from("destinations")
          .select("*")
          .ilike("title", pattern)
          .eq("content_type_id", "39")
          .limit(LIMIT),
        supabase
          .from("camping_sites")
          .select("*")
          .or(`faclt_nm.ilike.${pattern},addr1.ilike.${pattern}`)
          .limit(LIMIT),
        supabase
          .from("festivals")
          .select("*")
          .ilike("title", pattern)
          .limit(LIMIT),
        supabase
          .from("recipes")
          .select("*")
          .or(`name.ilike.${pattern},ingredients.ilike.${pattern}`)
          .limit(LIMIT),
      ])

    if (destResult.status === "fulfilled") destinations = (destResult.value.data ?? []) as Destination[]
    if (restaurantResult.status === "fulfilled") restaurants = (restaurantResult.value.data ?? []) as Destination[]
    if (campResult.status === "fulfilled") campingSites = (campResult.value.data ?? []) as CampingSite[]
    if (festivalResult.status === "fulfilled")
      festivals = (festivalResult.value.data ?? []).map((r) => rowToFestivalItem(r as Record<string, unknown>))
    if (recipeResult.status === "fulfilled") recipes = (recipeResult.value.data ?? []) as RecipeRow[]
  }

  const totalCount = destinations.length + restaurants.length + campingSites.length + festivals.length + recipes.length
  const hasResults = totalCount > 0

  const SECTIONS = [
    { key: "destinations", count: destinations.length, label: locale === "ko" ? "여행지" : "Destinations" },
    { key: "restaurants",  count: restaurants.length,  label: locale === "ko" ? "맛집" : "Restaurants" },
    { key: "camping",      count: campingSites.length,  label: locale === "ko" ? "캠핑장" : "Campsites" },
    { key: "festivals",    count: festivals.length,     label: locale === "ko" ? "행사·축제" : "Events" },
    { key: "recipes",      count: recipes.length,       label: locale === "ko" ? "레시피" : "Recipes" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {locale === "ko" ? "검색" : "Search"}
      </h1>

      <div className="mb-8">
        <SearchBar defaultValue={query} />
      </div>

      {/* 결과 탭 요약 */}
      {query && hasResults && (
        <div className="mb-6 flex flex-wrap gap-2">
          {SECTIONS.filter((s) => s.count > 0).map((s) => (
            <span
              key={s.key}
              className="rounded-full bg-[#FFF3EF] px-3 py-1 text-xs font-medium text-[#D84315]"
            >
              {s.label} {s.count}
            </span>
          ))}
        </div>
      )}

      {!query ? (
        <EmptyState
          title={locale === "ko" ? "검색어를 입력하세요" : "Enter a search term"}
          description={
            locale === "ko"
              ? "여행지, 캠핑장, 맛집, 행사·축제, 레시피를 검색할 수 있습니다."
              : "Search destinations, campsites, restaurants, events, and recipes."
          }
        />
      ) : !hasResults ? (
        <EmptyState
          title={locale === "ko" ? `"${query}"에 대한 결과가 없습니다` : `No results for "${query}"`}
          description={locale === "ko" ? "다른 검색어로 시도해 보세요." : "Try a different search term."}
        />
      ) : (
        <div className="flex flex-col gap-10">
          {destinations.length > 0 && (
            <section>
              <h2 className="mb-4 font-headline text-lg font-bold text-[#1B1C1A]">
                {locale === "ko" ? "여행지" : "Destinations"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({destinations.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {destinations.map((d) => (
                  <TravelCard key={d.id} item={destinationToSpotBase(d)} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {restaurants.length > 0 && (
            <section>
              <h2 className="mb-4 font-headline text-lg font-bold text-[#1B1C1A]">
                {locale === "ko" ? "맛집" : "Restaurants"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({restaurants.length})</span>
              </h2>
              <div className="flex flex-col gap-3">
                {restaurants.map((r) => (
                  <RestaurantCard key={r.id} item={destinationToRestaurant(r)} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {campingSites.length > 0 && (
            <section>
              <h2 className="mb-4 font-headline text-lg font-bold text-[#1B1C1A]">
                {locale === "ko" ? "캠핑장" : "Campsites"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({campingSites.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {campingSites.map((s) => (
                  <CampingCard key={s.id} item={siteToCampingBase(s)} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {festivals.length > 0 && (
            <section>
              <h2 className="mb-4 font-headline text-lg font-bold text-[#1B1C1A]">
                {locale === "ko" ? "행사·축제" : "Events"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({festivals.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {festivals.map((f) => (
                  <FestivalCard key={f.contentId} item={f} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {recipes.length > 0 && (
            <section>
              <h2 className="mb-4 font-headline text-lg font-bold text-[#1B1C1A]">
                {locale === "ko" ? "레시피" : "Recipes"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({recipes.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((r) => (
                  <RecipeCard key={r.id} item={r} locale={locale} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
