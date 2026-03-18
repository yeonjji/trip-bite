import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"
import { Headphones } from "lucide-react"

import { getAudioGuidePlaces } from "@/lib/data/audio-guide-places"
import { buildAlternates } from "@/lib/utils/metadata"
import TravelCard from "@/components/cards/TravelCard"
import AudioGuideFilters from "./_components/AudioGuideFilters"
import AudioGuidePagination from "./_components/AudioGuidePagination"
import type { AudioGuidePlace } from "@/types/audio-guide"
import type { TourSpotBase } from "@/types/tour-api"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ areaCode?: string; sigunguCode?: string; page?: string }>
}

export const dynamic = "force-dynamic"

const PAGE_SIZE = 12

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "ko" ? "편한여행 - 오디오 가이드" : "Comfortable Travel - Audio Guide",
    description:
      locale === "ko"
        ? "강원도 관광지 오디오 가이드로 더 깊이 있는 여행을 즐겨보세요."
        : "Explore Gangwon attractions with audio guides for a richer travel experience.",
    alternates: buildAlternates("/travel/comfortable"),
  }
}

function audioGuidePlaceToSpotBase(p: AudioGuidePlace): TourSpotBase {
  return {
    contentid: p.content_id,
    contenttypeid: p.content_type_id ?? "12",
    title: p.title,
    addr1: p.addr1,
    addr2: p.addr2,
    areacode: p.area_code,
    sigungucode: p.sigungu_code,
    mapx: p.mapx !== undefined ? String(p.mapx) : undefined,
    mapy: p.mapy !== undefined ? String(p.mapy) : undefined,
    firstimage: p.first_image,
    firstimage2: p.first_image2,
    tel: p.tel,
    homepage: p.homepage,
    overview: p.overview,
  }
}

export default async function ComfortableTravelPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { areaCode = "", sigunguCode = "", page: pageStr = "1" } = await searchParams

  setRequestLocale(locale)

  const page = Math.max(1, parseInt(pageStr, 10) || 1)

  const { items, totalCount } = await getAudioGuidePlaces({
    areaCode: areaCode || undefined,
    sigunguCode: sigunguCode || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const isKo = locale === "ko"

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
          <Headphones className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isKo ? "편한여행 - 오디오 가이드" : "Comfortable Travel - Audio Guide"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isKo
              ? "강원도 관광지 오디오 가이드로 더 깊이 있는 여행을 즐겨보세요"
              : "Explore Gangwon attractions with audio guides for a richer travel experience"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <AudioGuideFilters areaCode={areaCode} sigunguCode={sigunguCode} locale={locale} />
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {isKo
            ? "오디오 가이드 데이터가 없습니다. 동기화 스크립트를 실행해주세요."
            : "No audio guide places found. Please run the sync script."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((place) => (
              <TravelCard
                key={place.id}
                item={audioGuidePlaceToSpotBase(place)}
                locale={locale}
                detailPath={`/${locale}/travel/comfortable/${place.content_id}`}
              />
            ))}
          </div>

          {totalCount > PAGE_SIZE && (
            <div className="mt-8 flex justify-center">
              <Suspense>
                <AudioGuidePagination
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
