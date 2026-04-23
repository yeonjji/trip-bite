import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"
import { getFestivals, getFestivalRegions } from "@/lib/data/festivals"
import { buildAlternates } from "@/lib/utils/metadata"
import FestivalCard from "@/components/cards/FestivalCard"
import HeroSearch from "@/components/shared/HeroSearch"
import EventFilters from "./_components/EventFilters"
import EventPagination from "./_components/EventPagination"
import type { FestivalStatus } from "@/types/festival"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 12

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    region?: string
    status?: string
    page?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Festivals & Events" : "행사/축제",
    description:
      locale === "en"
        ? "Discover festivals and cultural events across Korea."
        : "전국의 축제와 문화 행사를 찾아보세요.",
    alternates: buildAlternates("/events"),
  }
}

export default async function EventsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { region = "", status = "", page: pageStr = "1" } = await searchParams

  setRequestLocale(locale)

  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const isKo = locale === "ko"

  const [{ items, totalCount }, regions] = await Promise.all([
    getFestivals({
      region: region || undefined,
      status: (status as FestivalStatus) || undefined,
      page,
    }),
    getFestivalRegions(),
  ])

  return (
    <>
      <HeroSearch variant="compact" locale={locale} />
      <div className="bg-[#F9F7F0] min-h-screen">
        <div className="max-w-7xl mx-auto flex">

          {/* 사이드바 (데스크탑) */}
          <aside className="hidden lg:flex w-64 shrink-0 border-r border-gray-200 bg-[#F9F7F0] flex-col gap-2 px-6 py-8 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
            <EventFilters regions={regions} locale={locale} />
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0 px-6 py-8">
            <h1 className="mb-6 text-2xl font-bold text-foreground">
              {isKo ? "행사/축제" : "Festivals & Events"}
            </h1>

            {/* 모바일 필터 */}
            <div className="lg:hidden mb-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <EventFilters regions={regions} locale={locale} />
            </div>

            {items.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                {isKo ? "행사가 없습니다." : "No events found."}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((festival) => (
                    <FestivalCard
                      key={festival.contentId}
                      item={festival}
                      locale={locale}
                    />
                  ))}
                </div>

                {totalCount > PAGE_SIZE && (
                  <div className="mt-8 flex justify-center">
                    <Suspense>
                      <EventPagination
                        currentPage={page}
                        totalCount={totalCount}
                        pageSize={PAGE_SIZE}
                      />
                    </Suspense>
                  </div>
                )}
              </>
            )}
          </main>

        </div>
      </div>
    </>
  )
}
