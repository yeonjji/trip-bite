"use client"

import { useRouter, usePathname } from "next/navigation"
import RegionFilter from "@/components/filters/RegionFilter"
import SigunguFilter from "@/components/filters/SigunguFilter"

const FEATURE_OPTIONS = [
  { value: "wheelchair", ko: "♿ 휠체어", en: "♿ Wheelchair" },
  { value: "elevator", ko: "🛗 엘리베이터", en: "🛗 Elevator" },
  { value: "restroom_wh", ko: "🚻 장애인화장실", en: "🚻 Restroom" },
  { value: "parking_wh", ko: "🅿️ 장애인주차", en: "🅿️ Parking" },
  { value: "audioguide", ko: "🔊 오디오가이드", en: "🔊 Audio Guide" },
]

interface BarrierFreeFiltersProps {
  areaCode: string
  sigunguCode: string
  features: string[]
  locale: string
}

export default function BarrierFreeFilters({
  areaCode,
  sigunguCode,
  features,
  locale,
}: BarrierFreeFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isKo = locale === "ko"

  function buildUrl(params: {
    areaCode?: string
    sigunguCode?: string
    features?: string[]
  }) {
    const sp = new URLSearchParams()
    const nextArea = params.areaCode ?? areaCode
    const nextSigungu = params.sigunguCode ?? sigunguCode
    const nextFeatures = params.features ?? features
    if (nextArea) sp.set("areaCode", nextArea)
    if (nextSigungu) sp.set("sigunguCode", nextSigungu)
    if (nextFeatures.length > 0) sp.set("features", nextFeatures.join(","))
    const qs = sp.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function toggleFeature(value: string) {
    const next = features.includes(value)
      ? features.filter((f) => f !== value)
      : [...features, value]
    router.push(buildUrl({ features: next }))
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
        {FEATURE_OPTIONS.map((opt) => {
          const active = features.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => toggleFeature(opt.value)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-border bg-background text-muted-foreground hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {isKo ? opt.ko : opt.en}
            </button>
          )
        })}
      </div>
    </div>
  )
}
