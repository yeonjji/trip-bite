"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useRef, useEffect } from "react"
import { MapPin, ChevronDown, Tent, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AREA_CODES, AREA_CODE_MAP } from "@/lib/constants/area-codes"
import { CAMPING_INDUTY } from "@/types/camping"

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

export default function CampingFilters({ locale }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isKo = locale === "ko"

  const doNm = searchParams.get("doNm") ?? ""
  const induty = searchParams.get("induty") ?? ""
  const petOnly = searchParams.get("petOnly") ?? ""
  const regionCode = DONM_TO_CODE[doNm] ?? ""

  const [regionOpen, setRegionOpen] = useState(false)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, val]) => {
        if (val) params.set(key, val)
        else params.delete(key)
      })
      params.delete("page")
      const qs = params.toString()
      router.push(qs ? `/${locale}/camping?${qs}` : `/${locale}/camping`)
    },
    [router, searchParams, locale]
  )

  const currentRegionName = regionCode
    ? (isKo ? AREA_CODE_MAP[regionCode]?.nameKo : AREA_CODE_MAP[regionCode]?.nameEn) ?? ""
    : isKo ? "전체 지역" : "All Regions"

  const hasFilters = doNm || induty || petOnly

  return (
    <div className="flex flex-col gap-0.5">
      <div className="mb-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Navigation</p>
        <p className="text-xs font-bold text-slate-700 tracking-wide uppercase">Camping</p>
      </div>

      {/* 유형 — nav 리스트 */}
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-1">
        {isKo ? "유형" : "Type"}
      </p>
      <button
        onClick={() => pushParams({ induty: "" })}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
          !induty
            ? "bg-white text-orange-700 font-bold shadow-sm"
            : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
        )}
      >
        <Tent className={cn("w-4 h-4 shrink-0", !induty ? "text-orange-700" : "text-slate-400")} />
        {isKo ? "전체" : "All"}
      </button>
      {INDUTY_ITEMS.map((item) => {
        const isActive = induty === item
        return (
          <button
            key={item}
            onClick={() => pushParams({ induty: item })}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
              isActive
                ? "bg-white text-orange-700 font-bold shadow-sm"
                : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
            )}
          >
            <span className={cn("w-4 h-4 shrink-0 flex items-center justify-center text-[8px]",
              isActive ? "text-orange-600" : "text-slate-300")}>●</span>
            {item}
          </button>
        )
      })}

      <div className="border-t border-gray-100 my-3" />

      {/* 지역 — 드롭다운 */}
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-1">
        {isKo ? "지역" : "Region"}
      </p>
      <div className="relative" ref={regionRef}>
        <button
          onClick={() => setRegionOpen((v) => !v)}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
            regionCode
              ? "bg-white text-orange-700 font-bold shadow-sm"
              : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
          )}
        >
          <MapPin className={cn("w-4 h-4 shrink-0", regionCode ? "text-orange-700" : "text-slate-400")} />
          <span className="flex-1 truncate">{currentRegionName}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform",
            regionOpen && "rotate-180",
            regionCode ? "text-orange-700" : "text-slate-400")} />
        </button>
        {regionOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
            <button
              onClick={() => { pushParams({ doNm: "" }); setRegionOpen(false) }}
              className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                !regionCode ? "text-orange-700 font-bold bg-orange-50" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
            >
              {isKo ? "전체 지역" : "All Regions"}
            </button>
            {AREA_CODES.map((area) => (
              <button
                key={area.code}
                onClick={() => { pushParams({ doNm: CODE_TO_DONM[area.code] ?? "" }); setRegionOpen(false) }}
                className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                  regionCode === area.code
                    ? "text-orange-700 font-bold bg-orange-50"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
              >
                {isKo ? area.nameKo : area.nameEn}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 my-3" />

      {/* 반려동물 필터 */}
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-1">
        {isKo ? "반려동물" : "Pets"}
      </p>
      <button
        onClick={() => pushParams({ petOnly: petOnly === "true" ? "" : "true" })}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
          petOnly === "true"
            ? "bg-white text-orange-700 font-bold shadow-sm"
            : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
        )}
      >
        <span className={cn("text-base shrink-0", petOnly === "true" ? "" : "opacity-60")}>🐾</span>
        {isKo ? "동반 가능" : "Pet-friendly"}
      </button>

      {hasFilters && (
        <>
          <div className="border-t border-gray-100 my-3" />
          <button
            onClick={() => router.push(`/${locale}/camping`)}
            className="flex items-center gap-2 w-full rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {isKo ? "필터 초기화" : "Reset filters"}
          </button>
        </>
      )}
    </div>
  )
}
