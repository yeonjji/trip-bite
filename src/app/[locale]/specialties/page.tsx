// P2-09: 특산품 목록 페이지 (서버 컴포넌트)

import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import SpecialtyCard from "@/components/cards/SpecialtyCard"
import { buildAlternates } from "@/lib/utils/metadata"
import EmptyState from "@/components/shared/EmptyState"
import HeroSearch from "@/components/shared/HeroSearch"
import { getSpecialties } from "@/lib/data/specialties"

import PaginationClient from "./_components/PaginationClient"
import SpecialtyFilters from "./_components/SpecialtyFilters"

const PAGE_SIZE = 30

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ areaCode?: string; category?: string; season?: string; page?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Local Specialties" : "특산품",
    description:
      locale === "en"
        ? "Explore local specialties from regions across Korea."
        : "전국의 지역 특산품을 탐색하세요.",
    alternates: buildAlternates("/specialties"),
  }
}

export default async function SpecialtiesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { areaCode, category, season, page: pageStr } = await searchParams

  setRequestLocale(locale)

  const page = Math.max(1, parseInt(pageStr ?? "1", 10))

  const { items, totalCount } = await getSpecialties({
    areaCode,
    category,
    season,
    page,
    pageSize: PAGE_SIZE,
  })

  return (
    <>
      <HeroSearch variant="compact" locale={locale} />
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {locale === "ko" ? "특산품" : "Local Specialties"}
      </h1>

      <div className="mb-6">
        <Suspense fallback={null}>
          <SpecialtyFilters locale={locale} />
        </Suspense>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={locale === "ko" ? "특산품이 없습니다." : "No specialties found."}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <SpecialtyCard
                key={item.id}
                item={item}
                locale={locale}
                regionName={item.regions?.name_ko}
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
              />
            </Suspense>
          </div>
        </>
      )}
    </div>
    </>
  )
}
