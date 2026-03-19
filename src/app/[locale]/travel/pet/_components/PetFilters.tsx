"use client"

import { useRouter, usePathname } from "next/navigation"
import RegionFilter from "@/components/filters/RegionFilter"
import SigunguFilter from "@/components/filters/SigunguFilter"

const PET_CL_OPTIONS = [
  { value: "", ko: "전체", en: "All" },
  { value: "1", ko: "실내", en: "Indoor" },
  { value: "2", ko: "실외", en: "Outdoor" },
  { value: "3", ko: "실내외", en: "Both" },
]

interface PetFiltersProps {
  areaCode: string
  sigunguCode: string
  petCl: string
  locale: string
}

export default function PetFilters({ areaCode, sigunguCode, petCl, locale }: PetFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isKo = locale === "ko"

  function buildUrl(params: { areaCode?: string; sigunguCode?: string; petCl?: string }) {
    const sp = new URLSearchParams()
    const nextArea = params.areaCode ?? areaCode
    const nextSigungu = params.sigunguCode ?? sigunguCode
    const nextPetCl = params.petCl !== undefined ? params.petCl : petCl
    if (nextArea) sp.set("areaCode", nextArea)
    if (nextSigungu) sp.set("sigunguCode", nextSigungu)
    if (nextPetCl) sp.set("petCl", nextPetCl)
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
      <div className="flex flex-wrap gap-2">
        {PET_CL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => router.push(buildUrl({ petCl: opt.value }))}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              petCl === opt.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {isKo ? opt.ko : opt.en}
          </button>
        ))}
      </div>
    </div>
  )
}
