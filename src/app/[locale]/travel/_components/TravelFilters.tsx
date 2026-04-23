"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect, useRef } from "react"
import { MapPin, ChevronDown, Layers, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AREA_CODES, AREA_CODE_MAP } from "@/lib/constants/area-codes"
import { TRAVEL_CONTENT_TYPES } from "@/lib/constants/content-types"
import { createClient } from "@/lib/supabase/client"

interface SigunguItem {
  area_code: string
  name_ko: string
  name_en: string
}

interface Props {
  locale: string
}

export default function TravelFilters({ locale }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isKo = locale === "ko"

  const areaCode = searchParams.get("areaCode") ?? ""
  const sigunguCode = searchParams.get("sigunguCode") ?? ""
  const contentTypeId = searchParams.get("contentTypeId") ?? ""

  const [regionOpen, setRegionOpen] = useState(false)
  const [sigunguOpen, setSigunguOpen] = useState(false)
  const [sigunguList, setSigunguList] = useState<SigunguItem[]>([])

  const regionRef = useRef<HTMLDivElement>(null)
  const sigunguRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!areaCode) { setSigunguList([]); return }
    const sb = createClient()
    sb.from("regions")
      .select("area_code, name_ko, name_en")
      .eq("parent_area_code", areaCode)
      .order("name_ko")
      .then(({ data }) => setSigunguList((data as SigunguItem[]) ?? []))
  }, [areaCode])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false)
      if (sigunguRef.current && !sigunguRef.current.contains(e.target as Node)) setSigunguOpen(false)
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
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams]
  )

  const currentRegionName = areaCode
    ? (isKo ? AREA_CODE_MAP[areaCode]?.nameKo : AREA_CODE_MAP[areaCode]?.nameEn) ?? ""
    : isKo ? "전체 지역" : "All Regions"

  const currentSigungu = sigunguList.find((s) => s.area_code === sigunguCode)
  const currentSigunguName = currentSigungu
    ? (isKo ? currentSigungu.name_ko : currentSigungu.name_en)
    : isKo ? "전체 시/군/구" : "All Districts"

  const hasFilters = areaCode || sigunguCode || contentTypeId

  return (
    <div className="flex flex-col gap-0.5">
      <div className="mb-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Navigation</p>
        <p className="text-xs font-bold text-slate-700 tracking-wide uppercase">Travel</p>
      </div>

      {/* 유형 — nav 리스트 */}
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-1">
        {isKo ? "유형" : "Type"}
      </p>
      <button
        onClick={() => pushParams({ contentTypeId: "" })}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
          !contentTypeId
            ? "bg-white text-orange-700 font-bold shadow-sm"
            : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
        )}
      >
        <Layers className={cn("w-4 h-4 shrink-0", !contentTypeId ? "text-orange-700" : "text-slate-400")} />
        {isKo ? "전체" : "All"}
      </button>
      {TRAVEL_CONTENT_TYPES.map((type) => {
        const isActive = contentTypeId === type.id
        return (
          <button
            key={type.id}
            onClick={() => pushParams({ contentTypeId: type.id })}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
              isActive
                ? "bg-white text-orange-700 font-bold shadow-sm"
                : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
            )}
          >
            <span className={cn("w-4 h-4 shrink-0 flex items-center justify-center text-[8px]",
              isActive ? "text-orange-600" : "text-slate-300")}>●</span>
            {isKo ? type.nameKo : type.nameEn}
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
            areaCode
              ? "bg-white text-orange-700 font-bold shadow-sm"
              : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
          )}
        >
          <MapPin className={cn("w-4 h-4 shrink-0", areaCode ? "text-orange-700" : "text-slate-400")} />
          <span className="flex-1 truncate">{currentRegionName}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform",
            regionOpen && "rotate-180",
            areaCode ? "text-orange-700" : "text-slate-400")} />
        </button>
        {regionOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
            <button
              onClick={() => { pushParams({ areaCode: "", sigunguCode: "" }); setRegionOpen(false) }}
              className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                !areaCode ? "text-orange-700 font-bold bg-orange-50" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
            >
              {isKo ? "전체 지역" : "All Regions"}
            </button>
            {AREA_CODES.map((area) => (
              <button
                key={area.code}
                onClick={() => { pushParams({ areaCode: area.code, sigunguCode: "" }); setRegionOpen(false) }}
                className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                  areaCode === area.code
                    ? "text-orange-700 font-bold bg-orange-50"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
              >
                {isKo ? area.nameKo : area.nameEn}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 시군구 — 드롭다운 (지역 선택 시만 표시) */}
      {areaCode && sigunguList.length > 0 && (
        <div className="relative" ref={sigunguRef}>
          <button
            onClick={() => setSigunguOpen((v) => !v)}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
              sigunguCode
                ? "bg-white text-orange-700 font-bold shadow-sm"
                : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
            )}
          >
            <span className={cn("w-4 h-4 shrink-0 flex items-center justify-center text-[10px]",
              sigunguCode ? "text-orange-600" : "text-slate-300")}>▸</span>
            <span className="flex-1 truncate">{currentSigunguName}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform",
              sigunguOpen && "rotate-180",
              sigunguCode ? "text-orange-700" : "text-slate-400")} />
          </button>
          {sigunguOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
              <button
                onClick={() => { pushParams({ sigunguCode: "" }); setSigunguOpen(false) }}
                className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                  !sigunguCode ? "text-orange-700 font-bold bg-orange-50" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
              >
                {isKo ? "전체 시/군/구" : "All Districts"}
              </button>
              {sigunguList.map((s) => (
                <button
                  key={s.area_code}
                  onClick={() => { pushParams({ sigunguCode: s.area_code }); setSigunguOpen(false) }}
                  className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                    sigunguCode === s.area_code
                      ? "text-orange-700 font-bold bg-orange-50"
                      : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
                >
                  {isKo ? s.name_ko : s.name_en}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 필터 초기화 */}
      {hasFilters && (
        <>
          <div className="border-t border-gray-100 my-3" />
          <button
            onClick={() => router.push(pathname)}
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
