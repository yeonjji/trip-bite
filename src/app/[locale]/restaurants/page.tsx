import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import RestaurantCard from "@/components/cards/RestaurantCard"
import { buildAlternates } from "@/lib/utils/metadata"
import EmptyState from "@/components/shared/EmptyState"
import HeroSearch from "@/components/shared/HeroSearch"
import { getRestaurants } from "@/lib/data/restaurants"
import type { RestaurantDetail } from "@/types/tour-api"
import type { Destination } from "@/types/database"

import PaginationClient from "./_components/PaginationClient"
import RestaurantFilters from "./_components/RestaurantFilters"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 30

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ areaCode?: string; sigunguCode?: string; cat3?: string; q?: string; page?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Restaurants" : "맛집",
    description:
      locale === "en"
        ? "Discover local restaurants across Korea."
        : "전국의 맛집을 탐색하세요.",
    alternates: buildAlternates("/restaurants"),
  }
}

function toRestaurantDetail(destination: Destination): RestaurantDetail {
  return {
    contentid: destination.content_id,
    contenttypeid: destination.content_type_id,
    title: destination.title,
    addr1: destination.addr1,
    addr2: destination.addr2,
    areacode: destination.area_code,
    sigungucode: destination.sigungu_code,
    firstimage: destination.first_image,
    firstimage2: destination.first_image2,
    mapx: destination.mapx ? String(destination.mapx) : undefined,
    mapy: destination.mapy ? String(destination.mapy) : undefined,
    tel: destination.tel,
    homepage: destination.homepage,
    overview: destination.overview,
  }
}

export default async function RestaurantsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { areaCode, sigunguCode, cat3, q, page: pageStr } = await searchParams

  setRequestLocale(locale)

  const page = Math.max(1, parseInt(pageStr ?? "1", 10))

  const { items, totalCount } = await getRestaurants({
    areaCode,
    sigunguCode,
    cat3,
    search: q || undefined,
    page,
    pageSize: PAGE_SIZE,
    sort: "rating",
  })

  return (
    <>
      <HeroSearch variant="compact" locale={locale} categoryPath="restaurants" defaultValue={q} />
      <div className="bg-[#F9F7F0] min-h-screen">
        <div className="max-w-7xl mx-auto flex">

          {/* 사이드바 (데스크탑) */}
          <aside className="hidden lg:flex w-64 shrink-0 border-r border-gray-200 bg-[#F9F7F0] flex-col gap-2 px-6 py-8 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
            <Suspense fallback={null}>
              <RestaurantFilters locale={locale} />
            </Suspense>
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0 px-6 py-8">
            <h1 className="mb-6 text-2xl font-bold text-foreground">
              {locale === "ko" ? "맛집" : "Restaurants"}
            </h1>

            {/* 모바일 필터 */}
            <div className="lg:hidden mb-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <Suspense fallback={null}>
                <RestaurantFilters locale={locale} />
              </Suspense>
            </div>

            {items.length === 0 ? (
              <EmptyState
                title={locale === "ko" ? "맛집이 없습니다." : "No restaurants found."}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((destination) => (
                    <RestaurantCard
                      key={destination.id}
                      item={toRestaurantDetail(destination)}
                      locale={locale}
                    />
                  ))}
                </div>

                <div className="mt-10 flex justify-center">
                  <Suspense fallback={null}>
                    <PaginationClient
                      currentPage={page}
                      totalCount={totalCount}
                      pageSize={PAGE_SIZE}
                      locale={locale}
                      areaCode={areaCode}
                    />
                  </Suspense>
                </div>
              </>
            )}
          </main>

        </div>
      </div>
    </>
  )
}
