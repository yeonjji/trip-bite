"use client"

import { useRouter, useSearchParams } from "next/navigation"

import RegionFilter from "@/components/filters/RegionFilter"
import SigunguFilter from "@/components/filters/SigunguFilter"
import Cat3Filter from "@/components/filters/Cat3Filter"

interface RestaurantFiltersProps {
  locale: string
}

export default function RestaurantFilters({ locale }: RestaurantFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const areaCode = searchParams.get("areaCode") ?? ""
  const sigunguCode = searchParams.get("sigunguCode") ?? ""
  const cat3 = searchParams.get("cat3") ?? ""

  function buildUrl(params: { areaCode?: string; sigunguCode?: string; cat3?: string }) {
    const next = new URLSearchParams(searchParams.toString())
    const nextArea = params.areaCode ?? areaCode
    const nextSigungu = params.sigunguCode ?? sigunguCode
    const nextCat3 = params.cat3 ?? cat3
    if (nextArea) { next.set("areaCode", nextArea) } else { next.delete("areaCode") }
    if (nextSigungu) { next.set("sigunguCode", nextSigungu) } else { next.delete("sigunguCode") }
    if (nextCat3) { next.set("cat3", nextCat3) } else { next.delete("cat3") }
    next.delete("page")
    return `/${locale}/restaurants?${next.toString()}`
  }

  return (
    <div className="flex flex-col gap-3">
      <RegionFilter
        value={areaCode}
        onChange={(code) => router.push(buildUrl({ areaCode: code, sigunguCode: "" }))}
        locale={locale}
      />
      {areaCode && (
        <SigunguFilter
          areaCode={areaCode}
          value={sigunguCode}
          onChange={(code) => router.push(buildUrl({ sigunguCode: code }))}
          locale={locale}
        />
      )}
      <Cat3Filter
        value={cat3}
        onChange={(id) => router.push(buildUrl({ cat3: id }))}
        locale={locale}
      />
    </div>
  )
}
