"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import RegionFilter from "@/components/filters/RegionFilter"
import type { SpecialtyCategory, Season } from "@/types/specialty"

const CATEGORIES: SpecialtyCategory[] = ["농산물", "수산물", "축산물", "가공식품", "공예품", "기타"]
const SEASONS: Season[] = ["봄", "여름", "가을", "겨울", "연중"]

interface SpecialtyFiltersProps {
  locale: string
}

export default function SpecialtyFilters({ locale }: SpecialtyFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const areaCode = searchParams.get("areaCode") ?? ""
  const category = searchParams.get("category") ?? ""
  const season = searchParams.get("season") ?? ""

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`/${locale}/specialties?${params.toString()}`)
  }

  function handleAreaChange(code: string) {
    updateParams("areaCode", code)
  }

  function handleCategoryChange(cat: string) {
    updateParams("category", cat === category ? "" : cat)
  }

  function handleSeasonChange(s: string) {
    updateParams("season", s === season ? "" : s)
  }

  const isKo = locale === "ko"

  return (
    <div className="space-y-3">
      <RegionFilter value={areaCode} onChange={handleAreaChange} locale={locale} />

      <div className="flex flex-wrap gap-2">
        <Button
          variant={category === "" ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryChange("")}
        >
          {isKo ? "전체 카테고리" : "All Categories"}
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={season === "" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSeasonChange("")}
        >
          {isKo ? "전체 계절" : "All Seasons"}
        </Button>
        {SEASONS.map((s) => (
          <Button
            key={s}
            variant={season === s ? "default" : "outline"}
            size="sm"
            onClick={() => handleSeasonChange(s)}
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  )
}
