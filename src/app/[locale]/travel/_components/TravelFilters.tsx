"use client"

import { useRouter, usePathname } from "next/navigation"
import RegionFilter from "@/components/filters/RegionFilter"
import ThemeFilter from "@/components/filters/ThemeFilter"
import SigunguFilter from "@/components/filters/SigunguFilter"

interface TravelFiltersProps {
  areaCode: string
  sigunguCode: string
  contentTypeId: string
  locale: string
}

export default function TravelFilters({
  areaCode,
  sigunguCode,
  contentTypeId,
  locale,
}: TravelFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  function buildUrl(params: { areaCode?: string; sigunguCode?: string; contentTypeId?: string }) {
    const sp = new URLSearchParams()
    const nextArea = params.areaCode ?? areaCode
    const nextSigungu = params.sigunguCode ?? sigunguCode
    const nextType = params.contentTypeId ?? contentTypeId
    if (nextArea) sp.set("areaCode", nextArea)
    if (nextSigungu) sp.set("sigunguCode", nextSigungu)
    if (nextType) sp.set("contentTypeId", nextType)
    const qs = sp.toString()
    return qs ? `${pathname}?${qs}` : pathname
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
      <ThemeFilter
        value={contentTypeId}
        onChange={(id) => router.push(buildUrl({ contentTypeId: id }))}
        locale={locale}
      />
    </div>
  )
}
