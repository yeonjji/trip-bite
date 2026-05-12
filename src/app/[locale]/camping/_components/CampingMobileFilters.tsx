"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { SlidersHorizontal, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AREA_CODES, AREA_CODE_MAP } from "@/lib/constants/area-codes"
import { CAMPING_INDUTY } from "@/types/camping"
import BottomSheet from "@/components/shared/BottomSheet"

const CODE_TO_DONM: Record<string, string> = {
  "11": "서울특별시",
  "28": "인천광역시",
  "30": "대전광역시",
  "27": "대구광역시",
  "29": "광주광역시",
  "26": "부산광역시",
  "31": "울산광역시",
  "36110": "세종특별자치시",
  "41": "경기도",
  "51": "강원도",
  "43": "충청북도",
  "44": "충청남도",
  "52": "전라북도",
  "46": "전라남도",
  "47": "경상북도",
  "48": "경상남도",
  "50": "제주특별자치도",
}

const DONM_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_TO_DONM).map(([code, doNm]) => [doNm, code])
)

const INDUTY_ITEMS = Object.values(CAMPING_INDUTY)

interface Props {
  locale: string
}

export default function CampingMobileFilters({ locale }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isKo = locale === "ko"

  const [sheetOpen, setSheetOpen] = useState(false)

  const doNm = searchParams.get("doNm") ?? ""
  const induty = searchParams.get("induty") ?? ""
  const petOnly = searchParams.get("petOnly") ?? ""
  const regionCode = DONM_TO_CODE[doNm] ?? ""

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete("page")
    const qs = params.toString()
    router.push(qs ? `/${locale}/camping?${qs}` : `/${locale}/camping`)
  }

  const regionName = regionCode
    ? (isKo ? AREA_CODE_MAP[regionCode]?.nameKo : AREA_CODE_MAP[regionCode]?.nameEn) ?? doNm
    : ""

  const activeFilterCount = [doNm, petOnly === "true" ? "1" : ""].filter(Boolean).length

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
            onClick={() => pushParams({ induty: "" })}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              !induty ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
            )}
          >
            {isKo ? "전체" : "All"}
          </button>
          {INDUTY_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => pushParams({ induty: item })}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                induty === item ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {item}
            </button>
          ))}
          {regionName && (
            <button
              onClick={() => pushParams({ doNm: "" })}
              className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-[#b05a42] text-white"
            >
              <MapPin className="w-3 h-3" />
              {regionName}
              <X className="w-3 h-3" />
            </button>
          )}
          {petOnly === "true" && (
            <button
              onClick={() => pushParams({ petOnly: "" })}
              className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-[#b05a42] text-white"
            >
              🐾
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
        onReset={() => { router.push(`/${locale}/camping`); setSheetOpen(false) }}
        resetLabel={isKo ? "초기화" : "Reset"}
        applyLabel={isKo ? "적용하기" : "Apply"}
        onApply={() => setSheetOpen(false)}
      >
        {/* 유형 */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            {isKo ? "유형" : "Type"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => pushParams({ induty: "" })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                !induty ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {isKo ? "전체" : "All"}
            </button>
            {INDUTY_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => pushParams({ induty: item })}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  induty === item ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                )}
              >
                {item}
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
              onClick={() => pushParams({ doNm: "" })}
              className={cn(
                "rounded-xl py-2.5 text-sm font-medium transition-colors text-center",
                !doNm ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {isKo ? "전체" : "All"}
            </button>
            {AREA_CODES.map((area) => (
              <button
                key={area.code}
                onClick={() => pushParams({ doNm: CODE_TO_DONM[area.code] ?? "" })}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-medium transition-colors text-center",
                  regionCode === area.code ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                )}
              >
                {isKo ? area.nameKo : area.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* 반려동물 */}
        <div className="mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            {isKo ? "반려동물" : "Pets"}
          </p>
          <button
            onClick={() => pushParams({ petOnly: petOnly === "true" ? "" : "true" })}
            className={cn(
              "w-full rounded-2xl py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              petOnly === "true" ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
            )}
          >
            <span>🐾</span>
            {isKo ? "반려동물 동반 가능" : "Pet-friendly"}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
