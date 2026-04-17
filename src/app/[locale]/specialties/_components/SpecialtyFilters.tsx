"use client"

import { useRouter, useSearchParams } from "next/navigation"

import RegionFilter from "@/components/filters/RegionFilter"
import type { SpecialtyCategory, Season } from "@/types/specialty"

const CATEGORIES: SpecialtyCategory[] = ["농산물", "수산물", "축산물", "가공식품", "공예품", "기타"]
const SEASONS: Season[] = ["봄", "여름", "가을", "겨울", "연중"]

interface SpecialtyFiltersProps {
  locale: string
}

const pill = (active: boolean) =>
  `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-primary text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
  }`

export default function SpecialtyFilters({ locale }: SpecialtyFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const areaCode = searchParams.get("areaCode") ?? ""
  const category = searchParams.get("category") ?? ""
  const season = searchParams.get("season") ?? ""

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) { params.set(key, value) } else { params.delete(key) }
    params.delete("page")
    router.push(`/${locale}/specialties?${params.toString()}`)
  }

  const isKo = locale === "ko"

  return (
    <div className="flex flex-col gap-4">
      <RegionFilter value={areaCode} onChange={(code) => updateParams("areaCode", code)} locale={locale} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-foreground">{isKo ? "카테고리" : "Category"}</span>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 flex-nowrap">
            <button className={pill(category === "")} onClick={() => updateParams("category", "")}>
              {isKo ? "전체" : "All"}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={pill(category === cat)}
                onClick={() => updateParams("category", category === cat ? "" : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-foreground">{isKo ? "계절" : "Season"}</span>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 flex-nowrap">
            <button className={pill(season === "")} onClick={() => updateParams("season", "")}>
              {isKo ? "전체" : "All"}
            </button>
            {SEASONS.map((s) => (
              <button
                key={s}
                className={pill(season === s)}
                onClick={() => updateParams("season", season === s ? "" : s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
