"use client"

import { useState, useEffect, useCallback } from "react"
import NaverPlaceCard, { type NaverPlace } from "@/components/nearby/NaverPlaceCard"
import { Skeleton } from "@/components/ui/skeleton"

const REGIONS = ["서울", "부산", "제주", "강릉", "여수", "전주"] as const
const CATEGORIES = ["맛집", "카페", "숙소", "관광지"] as const

type Region = (typeof REGIONS)[number]
type Category = (typeof CATEGORIES)[number]

export default function RegionalRecommendations() {
  const [region, setRegion] = useState<Region>("서울")
  const [category, setCategory] = useState<Category>("맛집")
  const [places, setPlaces] = useState<NaverPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchPlaces = useCallback(async (r: Region, c: Category) => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/naver/local?query=${encodeURIComponent(`${r} ${c}`)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPlaces(data.items ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlaces(region, category)
  }, [region, category, fetchPlaces])

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#b05a42]">
            발견
          </p>
          <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">
            오늘 어디로 떠나볼까요?
          </h2>
        </div>

        {/* 지역 탭 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                region === r
                  ? "bg-[#1B1C1A] text-white"
                  : "bg-[#F5F5F0] text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-[#b05a42] text-white"
                  : "bg-[#F5F5F0] text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 결과 */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-gray-400">
            장소 정보를 불러오지 못했습니다.
          </p>
        ) : places.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            검색된 장소가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {places.map((place, i) => (
              <NaverPlaceCard key={i} place={place} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
