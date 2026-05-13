import { Suspense } from "react"
import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import MarketCard from "@/components/cards/MarketCard"
import { buildAlternates } from "@/lib/utils/metadata"
import { getMarkets, getMarketRegions, getMarketTypes } from "@/lib/data/markets"
import HeroSearch from "@/components/shared/HeroSearch"
import ListingPagination from "@/components/shared/ListingPagination"

import MarketFilters from "./_components/MarketFilters"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 30

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ region?: string; mktType?: string; q?: string; page?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Traditional Markets" : "전통시장",
    description:
      locale === "en"
        ? "Explore traditional markets across Korea."
        : "전국의 전통시장을 탐색하세요.",
    alternates: buildAlternates("/markets"),
  }
}

export default async function MarketsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { region, mktType, q, page: pageStr } = await searchParams
  const page = Number(pageStr ?? "1") || 1
  const isKo = locale === "ko"

  const [{ items, totalCount }, regions, marketTypes] = await Promise.all([
    getMarkets({ region, mktType, search: q || undefined, page }),
    getMarketRegions(),
    getMarketTypes(),
  ])

  return (
    <>
      <HeroSearch variant="compact" locale={locale} categoryPath="markets" defaultValue={q} />
      <div className="bg-[#F9F7F0] min-h-screen">
        <div className="max-w-7xl mx-auto flex">

          {/* 사이드바 (데스크탑) */}
          <aside className="hidden lg:flex w-64 shrink-0 border-r border-gray-200 bg-[#F9F7F0] flex-col gap-2 px-6 py-8 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
            <Suspense>
              <MarketFilters locale={locale} regions={regions} marketTypes={marketTypes} />
            </Suspense>
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0 px-6 py-8">
            <h1 className="mb-6 text-2xl font-bold text-foreground">
              {isKo ? "전통시장" : "Traditional Markets"}
            </h1>

            {items.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                {isKo ? "검색 결과가 없습니다." : "No markets found."}
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {isKo ? `총 ${totalCount.toLocaleString()}개` : `${totalCount.toLocaleString()} markets`}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <MarketCard key={item.mktId} item={item} locale={locale} />
                  ))}
                </div>
              </>
            )}

            {totalCount > PAGE_SIZE && (
              <div className="mt-8 flex justify-center">
                <Suspense>
                  <ListingPagination
                    currentPage={page}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                  />
                </Suspense>
              </div>
            )}
          </main>

        </div>
      </div>
    </>
  )
}
