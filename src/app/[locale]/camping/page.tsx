import { Suspense } from "react"
import type { Metadata } from "next"

import CampingCard from "@/components/cards/CampingCard"
import { buildAlternates } from "@/lib/utils/metadata"
import { getCampingSites } from "@/lib/data/camping"
import HeroSearch from "@/components/shared/HeroSearch"
import type { CampingSite } from "@/types/database"

import CampingFilters from "./_components/CampingFilters"
import CampingPagination from "./_components/CampingPagination"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    doNm?: string
    induty?: string
    page?: string
  }>
}

const PAGE_SIZE = 30

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Camping Sites" : "캠핑장",
    description:
      locale === "en"
        ? "Find camping sites across Korea."
        : "전국의 캠핑장을 탐색하세요.",
    alternates: buildAlternates("/camping"),
  }
}

function toCardItem(site: CampingSite) {
  return {
    contentId: site.content_id,
    facltNm: site.faclt_nm,
    lineIntro: site.line_intro,
    doNm: site.do_nm,
    sigunguNm: site.sigungu_nm,
    addr1: site.addr1,
    addr2: site.addr2,
    mapX: site.mapx?.toString(),
    mapY: site.mapy?.toString(),
    tel: site.tel,
    homepage: site.homepage,
    firstImageUrl: site.first_image_url,
    induty: site.induty,
    ratingAvg: site.rating_avg,
    ratingCount: site.rating_count,
  }
}

export default async function CampingPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { doNm, induty, page: pageStr } = await searchParams
  const page = Number(pageStr ?? "1") || 1

  const { items, totalCount } = await getCampingSites({
    doNm,
    induty,
    page,
    pageSize: PAGE_SIZE,
    sort: "rating",
  })

  return (
    <>
      <HeroSearch variant="compact" locale={locale} />
      <div className="bg-[#F9F7F0] min-h-screen">
        <div className="max-w-7xl mx-auto flex">

          {/* 사이드바 (데스크탑) */}
          <aside className="hidden lg:flex w-64 shrink-0 border-r border-gray-200 bg-[#F9F7F0] flex-col gap-2 px-6 py-8 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
            <Suspense>
              <CampingFilters locale={locale} />
            </Suspense>
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0 px-6 py-8">
            <h1 className="mb-6 text-2xl font-bold text-foreground">
              {locale === "ko" ? "캠핑장" : "Camping Sites"}
            </h1>

            {/* 모바일 필터 */}
            <div className="lg:hidden mb-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <Suspense>
                <CampingFilters locale={locale} />
              </Suspense>
            </div>

            {items.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                {locale === "ko" ? "검색 결과가 없습니다." : "No camping sites found."}
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {locale === "ko" ? `총 ${totalCount.toLocaleString()}개` : `${totalCount.toLocaleString()} sites`}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((site) => (
                    <CampingCard key={site.id} item={toCardItem(site)} locale={locale} />
                  ))}
                </div>
              </>
            )}

            {totalCount > PAGE_SIZE && (
              <div className="mt-8 flex justify-center">
                <Suspense>
                  <CampingPagination
                    locale={locale}
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
