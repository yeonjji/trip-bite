import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getBarrierFreePlaces } from "@/lib/data/barrier-free-places"
import { buildAlternates } from "@/lib/utils/metadata"
import BarrierFreeCard from "@/components/cards/BarrierFreeCard"
import BarrierFreeFilters from "./_components/BarrierFreeFilters"
import BarrierFreePagination from "./_components/BarrierFreePagination"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    areaCode?: string
    sigunguCode?: string
    features?: string
    page?: string
  }>
}

export const dynamic = "force-dynamic"

const PAGE_SIZE = 12

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "ko" ? "무장애 여행" : "Barrier-Free Travel",
    description:
      locale === "ko"
        ? "누구나 편리하게 즐길 수 있는 여행지를 찾아보세요."
        : "Find destinations accessible to everyone.",
    alternates: buildAlternates("/travel/barrier-free"),
  }
}

export default async function BarrierFreePage({ params, searchParams }: Props) {
  const { locale } = await params
  const {
    areaCode = "",
    sigunguCode = "",
    features: featuresStr = "",
    page: pageStr = "1",
  } = await searchParams

  setRequestLocale(locale)

  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const features = featuresStr ? featuresStr.split(",").filter(Boolean) : []
  const isKo = locale === "ko"

  const { items, totalCount } = await getBarrierFreePlaces({
    areaCode: areaCode || undefined,
    sigunguCode: sigunguCode || undefined,
    features: features.length > 0 ? features : undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        {isKo ? "무장애 여행" : "Barrier-Free Travel"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isKo
          ? "누구나 편리하게 즐길 수 있는 여행지를 찾아보세요"
          : "Find destinations accessible to everyone"}
      </p>

      <div className="mb-6">
        <BarrierFreeFilters
          areaCode={areaCode}
          sigunguCode={sigunguCode}
          features={features}
          locale={locale}
        />
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {isKo
            ? "무장애 여행지 데이터가 없습니다. 동기화 스크립트를 실행해주세요."
            : "No barrier-free places found. Please run the sync script."}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {isKo
              ? `총 ${totalCount.toLocaleString()}개`
              : `${totalCount.toLocaleString()} results`}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((place) => (
              <BarrierFreeCard key={place.id} item={place} locale={locale} />
            ))}
          </div>

          {totalCount > PAGE_SIZE && (
            <div className="mt-8 flex justify-center">
              <Suspense>
                <BarrierFreePagination
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
  )
}
