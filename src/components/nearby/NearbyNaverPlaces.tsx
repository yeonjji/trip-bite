"use client"

import { useState, useEffect, useCallback } from "react"
import NaverPlaceCard, { type NaverPlace } from "./NaverPlaceCard"
import { Skeleton } from "@/components/ui/skeleton"

const TABS = [
  { label: "맛집", keyword: "맛집" },
  { label: "카페", keyword: "카페" },
  { label: "숙소", keyword: "숙소" },
  { label: "주차장", keyword: "주차장" },
] as const

interface Props {
  regionName: string
}

export default function NearbyNaverPlaces({ regionName }: Props) {
  const [activeTab, setActiveTab] = useState(0)
  const [places, setPlaces] = useState<NaverPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchPlaces = useCallback(async (tabIndex: number) => {
    setLoading(true)
    setError(false)
    const query = `${regionName} ${TABS[tabIndex].keyword}`
    try {
      const res = await fetch(`/api/naver/local?query=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPlaces(data.items ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [regionName])

  useEffect(() => {
    fetchPlaces(activeTab)
  }, [activeTab, fetchPlaces])

  const handleTab = (index: number) => {
    if (index === activeTab) return
    setActiveTab(index)
  }

  return (
    <div className="mb-6">
      <h2 className="mb-4 font-headline text-xl font-bold text-[#1B1C1A]">
        이 근처에서 같이 가볼 곳
      </h2>

      {/* 탭 */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab, i) => (
          <button
            key={tab.keyword}
            onClick={() => handleTab(i)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === i
                ? "bg-[#1B1C1A] text-white"
                : "bg-[#F5F5F0] text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 결과 */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-gray-400">
          주변 장소 정보를 불러오지 못했습니다.
        </p>
      ) : places.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          주변에 검색된 장소가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
          {places.slice(0, 6).map((place, i) => (
            <NaverPlaceCard key={i} place={place} />
          ))}
        </div>
      )}
    </div>
  )
}
