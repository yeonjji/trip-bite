import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { audioGuideApi } from "@/lib/api/audio-guide-api"
import { buildAlternates } from "@/lib/utils/metadata"
import AudioGuideCard from "@/components/cards/AudioGuideCard"
import AudioGuidePagination from "./_components/AudioGuidePagination"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}

export const dynamic = "force-dynamic"

const PAGE_SIZE = 12

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "ko" ? "오디오 가이드" : "Audio Guide",
    description:
      locale === "ko"
        ? "관광지 오디오 해설을 들어보세요."
        : "Listen to audio commentary for tourist attractions.",
    alternates: buildAlternates("/easy-travel/audio-guide"),
  }
}

export default async function AudioGuidePage({ params, searchParams }: Props) {
  const { locale } = await params
  const { page: pageStr = "1" } = await searchParams

  setRequestLocale(locale)

  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const isKo = locale === "ko"
  const langCode = locale === "ko" ? "ko" : "en"

  let items: Awaited<ReturnType<typeof audioGuideApi.getList>>["items"] = []
  let totalCount = 0
  let error: string | null = null

  try {
    const result = await audioGuideApi.getList({
      numOfRows: PAGE_SIZE,
      pageNo: page,
      langCode,
    })
    items = result.items
    totalCount = result.totalCount
  } catch (e) {
    error = e instanceof Error ? e.message : "알 수 없는 오류"
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        {isKo ? "오디오 가이드" : "Audio Guide"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isKo
          ? "관광지 오디오 해설을 들어보세요"
          : "Listen to audio commentary for tourist attractions"}
      </p>

      {error ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm">
            {isKo
              ? "오디오 가이드 데이터를 불러올 수 없습니다."
              : "Unable to load audio guide data."}
          </p>
          <p className="mt-1 text-xs opacity-60">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {isKo ? "오디오 가이드 데이터가 없습니다." : "No audio guide data found."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <AudioGuideCard key={`${item.tid}-${item.tlid}`} item={item} />
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
