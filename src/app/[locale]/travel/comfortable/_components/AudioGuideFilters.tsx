"use client"

import { useRouter, usePathname } from "next/navigation"
import RegionFilter from "@/components/filters/RegionFilter"
import SigunguFilter from "@/components/filters/SigunguFilter"

interface AudioGuideFiltersProps {
  areaCode: string
  sigunguCode: string
  locale: string
}

export default function AudioGuideFilters({ areaCode, sigunguCode, locale }: AudioGuideFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  function buildUrl(params: { areaCode?: string; sigunguCode?: string }) {
    const sp = new URLSearchParams()
    const nextArea = params.areaCode ?? areaCode
    const nextSigungu = params.sigunguCode ?? sigunguCode
    if (nextArea) sp.set("areaCode", nextArea)
    if (nextSigungu) sp.set("sigunguCode", nextSigungu)
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
    </div>
  )
}
