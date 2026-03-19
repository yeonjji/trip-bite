import { Suspense } from "react"
import Link from "next/link"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getPetPlaces } from "@/lib/data/pet-places"
import { getCampingSites } from "@/lib/data/camping"
import { buildAlternates } from "@/lib/utils/metadata"
import PetCard from "@/components/cards/PetCard"
import CampingCard from "@/components/cards/CampingCard"
import PetFilters from "./_components/PetFilters"
import PetPagination from "./_components/PetPagination"
import type { CampingSite } from "@/types/database"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    areaCode?: string
    sigunguCode?: string
    petCl?: string
    page?: string
  }>
}

export const dynamic = "force-dynamic"

const PAGE_SIZE = 12

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "ko" ? "반려동물 여행" : "Pet-Friendly Travel",
    description:
      locale === "ko"
        ? "반려동물과 함께할 수 있는 여행지를 찾아보세요."
        : "Find pet-friendly travel destinations across Korea.",
    alternates: buildAlternates("/travel/pet"),
  }
}

function toCampingCardItem(site: CampingSite) {
  return {
    contentId: site.content_id,
    facltNm: site.faclt_nm,
    lineIntro: site.line_intro,
    doNm: site.do_nm,
    sigunguNm: site.sigungu_nm,
    addr1: site.addr1,
    firstImageUrl: site.first_image_url,
    induty: site.induty,
    animalCmgCl: site.animal_cmg_cl,
  }
}

export default async function PetTravelPage({ params, searchParams }: Props) {
  const { locale } = await params
  const {
    areaCode = "",
    sigunguCode = "",
    petCl = "",
    page: pageStr = "1",
  } = await searchParams

  setRequestLocale(locale)

  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const isKo = locale === "ko"

  const [{ items, totalCount }, { items: campingSites }] = await Promise.all([
    getPetPlaces({
      areaCode: areaCode || undefined,
      sigunguCode: sigunguCode || undefined,
      petCl: petCl || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    getCampingSites({ animalCmgCl: "가능", pageSize: 4 }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        {isKo ? "반려동물 여행" : "Pet-Friendly Travel"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isKo
          ? "반려동물과 함께할 수 있는 여행지를 찾아보세요"
          : "Find travel destinations you can enjoy with your pet"}
      </p>

      <div className="mb-6">
        <PetFilters
          areaCode={areaCode}
          sigunguCode={sigunguCode}
          petCl={petCl}
          locale={locale}
        />
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {isKo
            ? "반려동물 여행지 데이터가 없습니다. 동기화 스크립트를 실행해주세요."
            : "No pet-friendly places found. Please run the sync script."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((place) => (
              <PetCard key={place.id} item={place} locale={locale} />
            ))}
          </div>

          {totalCount > PAGE_SIZE && (
            <div className="mt-8 flex justify-center">
              <Suspense>
                <PetPagination
                  currentPage={page}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                />
              </Suspense>
            </div>
          )}
        </>
      )}

      {/* 반려동물 동반 캠핑장 섹션 */}
      {campingSites.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {isKo ? "🏕️ 반려동물 동반 캠핑장" : "🏕️ Pet-Friendly Camping"}
            </h2>
            <Link
              href={`/${locale}/camping?animalCmgCl=가능`}
              className="text-sm text-primary hover:underline"
            >
              {isKo ? "전체보기" : "View All"}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {campingSites.map((site) => (
              <CampingCard key={site.id} item={toCampingCardItem(site)} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
