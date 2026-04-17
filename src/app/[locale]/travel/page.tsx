import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getDestinations } from "@/lib/data/destinations"
import { buildAlternates } from "@/lib/utils/metadata"
import TravelCard from "@/components/cards/TravelCard"
import HeroSearch from "@/components/shared/HeroSearch"
import TravelFilters from "./_components/TravelFilters"
import TravelPagination from "./_components/TravelPagination"
import type { TourSpotBase } from "@/types/tour-api"
import type { Destination } from "@/types/database"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    areaCode?: string
    sigunguCode?: string
    contentTypeId?: string
    page?: string
  }>
}

export const dynamic = "force-dynamic"

const PAGE_SIZE = 30

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Travel Destinations" : "여행지",
    description:
      locale === "en"
        ? "Explore travel destinations across Korea."
        : "전국의 여행지를 탐색하세요.",
    alternates: buildAlternates("/travel"),
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
    homepage: d.homepage,
    overview: d.overview,
  }
}

export default async function TravelPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { areaCode = "", sigunguCode = "", contentTypeId = "", page: pageStr = "1" } = await searchParams

  setRequestLocale(locale)

  const page = Math.max(1, parseInt(pageStr, 10) || 1)

  const { items, totalCount } = await getDestinations({
    areaCode: areaCode || undefined,
    sigunguCode: sigunguCode || undefined,
    contentTypeId: contentTypeId || undefined,
    page,
    pageSize: PAGE_SIZE,
    sort: "rating",
  })

  return (
    <>
      <HeroSearch variant="compact" locale={locale} />
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {locale === "ko" ? "여행지" : "Travel Destinations"}
      </h1>

      <div className="mb-6">
        <TravelFilters
          areaCode={areaCode}
          sigunguCode={sigunguCode}
          contentTypeId={contentTypeId}
          locale={locale}
        />
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {locale === "ko" ? "여행지가 없습니다." : "No destinations found."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((destination) => (
              <TravelCard
                key={destination.id}
                item={destinationToSpotBase(destination)}
                locale={locale}
              />
            ))}
          </div>

          {totalCount > PAGE_SIZE && (
            <div className="mt-8 flex justify-center">
              <Suspense>
                <TravelPagination
                  currentPage={page}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                />
              </Suspense>
            </div>
          )}
        </>
      )}
    </div>
    </>
  )
}
