"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { SlidersHorizontal, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AREA_CODES, AREA_CODE_MAP } from "@/lib/constants/area-codes"
import { createClient } from "@/lib/supabase/client"
import BottomSheet from "@/components/shared/BottomSheet"

interface SigunguItem {
  area_code: string
  name_ko: string
  name_en: string
}

const RESTAURANT_CAT3 = [
  { id: "A05020100", nameKo: "한식", nameEn: "Korean" },
  { id: "A05020200", nameKo: "서양식", nameEn: "Western" },
  { id: "A05020300", nameKo: "일식", nameEn: "Japanese" },
  { id: "A05020400", nameKo: "중식", nameEn: "Chinese" },
  { id: "A05020900", nameKo: "카페/전통찻집", nameEn: "Cafe & Tea" },
]

interface Props {
  locale: string
}

export default function RestaurantMobileFilters({ locale }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isKo = locale === "ko"

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sigunguList, setSigunguList] = useState<SigunguItem[]>([])

  const areaCode = searchParams.get("areaCode") ?? ""
  const sigunguCode = searchParams.get("sigunguCode") ?? ""
  const cat3 = searchParams.get("cat3") ?? ""

  useEffect(() => {
    if (!areaCode) { setSigunguList([]); return }
    const sb = createClient()
    sb.from("regions")
      .select("area_code, name_ko, name_en")
      .eq("parent_area_code", areaCode)
      .order("name_ko")
      .then(({ data }) => setSigunguList((data as SigunguItem[]) ?? []))
  }, [areaCode])

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete("page")
    const qs = params.toString()
    router.push(qs ? `/${locale}/restaurants?${qs}` : `/${locale}/restaurants`)
  }

  const regionName = areaCode
    ? (isKo ? AREA_CODE_MAP[areaCode]?.nameKo : AREA_CODE_MAP[areaCode]?.nameEn) ?? ""
    : ""

  const sigunguName = sigunguList.find(s => s.area_code === sigunguCode)
  const currentCat = RESTAURANT_CAT3.find(c => c.id === cat3)
  const activeFilterCount = [areaCode, sigunguCode].filter(Boolean).length

  return (
    <div className="lg:hidden">
      {/* 상단 필터 칩 바 */}
      <div className="flex gap-2 items-center px-4 py-2.5 bg-white border-b border-stone-100">
        <button
          onClick={() => setSheetOpen(true)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
            activeFilterCount > 0
              ? "bg-[#b05a42] text-white border-[#b05a42]"
              : "bg-white text-stone-600 border-stone-300"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {isKo ? "필터" : "Filter"}
          {activeFilterCount > 0 && (
            <span className="bg-white/30 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="w-px h-4 bg-stone-200 shrink-0" />

        <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1">
          <button
            onClick={() => pushParams({ cat3: "" })}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              !cat3 ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
            )}
          >
            {isKo ? "전체" : "All"}
          </button>
          {RESTAURANT_CAT3.map((cat) => (
            <button
              key={cat.id}
              onClick={() => pushParams({ cat3: cat.id })}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                cat3 === cat.id ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {isKo ? cat.nameKo : cat.nameEn}
            </button>
          ))}
          {regionName && (
            <button
              onClick={() => pushParams({ areaCode: "", sigunguCode: "" })}
              className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-[#b05a42] text-white"
            >
              <MapPin className="w-3 h-3" />
              {sigunguName ? (isKo ? sigunguName.name_ko : sigunguName.name_en) : regionName}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={isKo ? "필터" : "Filter"}
        onReset={() => { router.push(`/${locale}/restaurants`); setSheetOpen(false) }}
        resetLabel={isKo ? "초기화" : "Reset"}
        applyLabel={isKo ? "적용하기" : "Apply"}
        onApply={() => setSheetOpen(false)}
      >
        {/* 음식 종류 */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            {isKo ? "음식 종류" : "Cuisine"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => pushParams({ cat3: "" })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                !cat3 ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {isKo ? "전체" : "All"}
            </button>
            {RESTAURANT_CAT3.map((cat) => (
              <button
                key={cat.id}
                onClick={() => pushParams({ cat3: cat.id })}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  cat3 === cat.id ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                )}
              >
                {isKo ? cat.nameKo : cat.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            {isKo ? "지역" : "Region"}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => pushParams({ areaCode: "", sigunguCode: "" })}
              className={cn(
                "rounded-xl py-2.5 text-sm font-medium transition-colors text-center",
                !areaCode ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {isKo ? "전체" : "All"}
            </button>
            {AREA_CODES.map((area) => (
              <button
                key={area.code}
                onClick={() => pushParams({ areaCode: area.code, sigunguCode: "" })}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-medium transition-colors text-center",
                  areaCode === area.code ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                )}
              >
                {isKo ? area.nameKo : area.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* 시/군/구 */}
        {areaCode && sigunguList.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
              {isKo ? "시/군/구" : "District"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => pushParams({ sigunguCode: "" })}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-medium transition-colors text-center",
                  !sigunguCode ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                )}
              >
                {isKo ? "전체" : "All"}
              </button>
              {sigunguList.map((s) => (
                <button
                  key={s.area_code}
                  onClick={() => pushParams({ sigunguCode: s.area_code })}
                  className={cn(
                    "rounded-xl py-2.5 text-sm font-medium transition-colors text-center",
                    sigunguCode === s.area_code ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                  )}
                >
                  {isKo ? s.name_ko : s.name_en}
                </button>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
