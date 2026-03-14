import { Suspense } from "react"
import type { Metadata } from "next"

import CampingCard from "@/components/cards/CampingCard"
import { buildAlternates } from "@/lib/utils/metadata"
import { getCampingSites } from "@/lib/data/camping"
import type { CampingSite } from "@/types/database"

import CampingFilters from "./_components/CampingFilters"
import CampingPagination from "./_components/CampingPagination"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    doNm?: string
    induty?: string
    animalCmgCl?: string
    page?: string
  }>
}

const PAGE_SIZE = 12

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
  const { doNm, induty, animalCmgCl, page: pageStr } = await searchParams
  const page = Number(pageStr ?? "1") || 1

  const { items, totalCount } = await getCampingSites({
    doNm,
    induty,
    animalCmgCl,
    page,
    pageSize: PAGE_SIZE,
    sort: "rating",
  })

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">캠핑장</h1>

      <Suspense>
        <CampingFilters locale={locale} />
      </Suspense>

      <div className="mt-6">
        {items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              총 {totalCount.toLocaleString()}개
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((site) => (
                <CampingCard key={site.id} item={toCardItem(site)} locale={locale} />
              ))}
            </div>
          </>
        )}
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="mt-8">
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
  )
}
