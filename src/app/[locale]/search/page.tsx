import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { buildAlternates } from "@/lib/utils/metadata"
import SearchBar from "@/components/search/SearchBar"
import TravelCard from "@/components/cards/TravelCard"
import CampingCard from "@/components/cards/CampingCard"
import EmptyState from "@/components/shared/EmptyState"
import type { Destination, CampingSite } from "@/types/database"
import type { TourSpotBase } from "@/types/tour-api"
import type { CampingSiteBase } from "@/types/camping"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; type?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" 검색 결과` : "검색",
    description: q ? `"${q}"에 대한 여행지 및 캠핑장 검색 결과입니다.` : "여행지, 캠핑장을 검색하세요.",
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

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { q, type } = await searchParams

  setRequestLocale(locale)

  const query = q?.trim() ?? ""

  let destinations: Destination[] = []
  let campingSites: CampingSite[] = []

  if (query) {
    const supabase = await createClient()
    const pattern = `%${query}%`

    const shouldSearchDestinations = !type || type === "destination"
    const shouldSearchCamping = !type || type === "camping"

    const [destResult, campResult] = await Promise.all([
      shouldSearchDestinations
        ? supabase
            .from("destinations")
            .select("*")
            .or(`title.ilike.${pattern},addr1.ilike.${pattern}`)
            .limit(24)
        : Promise.resolve({ data: [], error: null }),
      shouldSearchCamping
        ? supabase
            .from("camping_sites")
            .select("*")
            .or(`faclt_nm.ilike.${pattern},addr1.ilike.${pattern}`)
            .limit(24)
        : Promise.resolve({ data: [], error: null }),
    ])

    destinations = (destResult.data ?? []) as Destination[]
    campingSites = (campResult.data ?? []) as CampingSite[]
  }

  const totalCount = destinations.length + campingSites.length
  const hasResults = totalCount > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {locale === "ko" ? "검색" : "Search"}
      </h1>

      <div className="mb-8">
        <SearchBar defaultValue={query} />
      </div>

      {!query ? (
        <EmptyState
          title={locale === "ko" ? "검색어를 입력하세요" : "Enter a search term"}
          description={
            locale === "ko"
              ? "여행지, 캠핑장 이름 또는 주소로 검색할 수 있습니다."
              : "Search by destination name, campsite name, or address."
          }
        />
      ) : !hasResults ? (
        <EmptyState
          title={
            locale === "ko"
              ? `"${query}"에 대한 결과가 없습니다`
              : `No results for "${query}"`
          }
          description={
            locale === "ko"
              ? "다른 검색어로 시도해 보세요."
              : "Try a different search term."
          }
        />
      ) : (
        <div className="flex flex-col gap-10">
          {destinations.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {locale === "ko" ? "여행지" : "Destinations"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({destinations.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {destinations.map((d) => (
                  <TravelCard
                    key={d.id}
                    item={destinationToSpotBase(d)}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          )}

          {campingSites.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {locale === "ko" ? "캠핑장" : "Campsites"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({campingSites.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {campingSites.map((s) => (
                  <CampingCard
                    key={s.id}
                    item={siteToCampingBase(s)}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
