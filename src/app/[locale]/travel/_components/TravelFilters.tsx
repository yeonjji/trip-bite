"use client"

import { useRouter, usePathname } from "next/navigation"
import RegionFilter from "@/components/filters/RegionFilter"
import ThemeFilter from "@/components/filters/ThemeFilter"

interface TravelFiltersProps {
  areaCode: string
  contentTypeId: string
  locale: string
}

export default function TravelFilters({
  areaCode,
  contentTypeId,
  locale,
}: TravelFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  function buildUrl(params: { areaCode?: string; contentTypeId?: string }) {
    const sp = new URLSearchParams()
    const nextArea = params.areaCode ?? areaCode
    const nextType = params.contentTypeId ?? contentTypeId
    if (nextArea) sp.set("areaCode", nextArea)
    if (nextType) sp.set("contentTypeId", nextType)
    // 필터 변경 시 1페이지로 초기화
    const qs = sp.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="flex flex-col gap-3">
      <RegionFilter
        value={areaCode}
        onChange={(code) => router.push(buildUrl({ areaCode: code }))}
        locale={locale}
      />
      <ThemeFilter
        value={contentTypeId}
        onChange={(id) => router.push(buildUrl({ contentTypeId: id }))}
        locale={locale}
      />
    </div>
  )
}
