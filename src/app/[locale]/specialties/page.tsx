// P2-09: 특산품 목록 페이지 (서버 컴포넌트)

import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"

import SpecialtyCard from "@/components/cards/SpecialtyCard"
import EmptyState from "@/components/shared/EmptyState"
import { getSpecialties } from "@/lib/data/specialties"

import PaginationClient from "./_components/PaginationClient"
import SpecialtyFilters from "./_components/SpecialtyFilters"

const PAGE_SIZE = 12

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ areaCode?: string; category?: string; season?: string; page?: string }>
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
    <div className="mx-auto max-w-7xl px-4 py-8">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  )
}
