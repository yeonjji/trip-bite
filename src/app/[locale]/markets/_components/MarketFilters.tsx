"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useRef, useEffect } from "react"
import { MapPin, ChevronDown, Store, X } from "lucide-react"
import { cn } from "@/lib/utils"

const MARKET_TYPES = ["상설시장", "정기시장", "인정시장", "등록시장", "무등록시장"]

interface Props {
  locale: string
  regions: string[]
}

export default function MarketFilters({ locale, regions }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isKo = locale === "ko"

  const region = searchParams.get("region") ?? ""
  const mktType = searchParams.get("mktType") ?? ""

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
      router.push(qs ? `/${locale}/markets?${qs}` : `/${locale}/markets`)
    },
    [router, searchParams, locale]
  )

  const hasFilters = region || mktType

  return (
    <div className="flex flex-col gap-0.5">
      <div className="mb-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Navigation</p>
        <p className="text-xs font-bold text-slate-700 tracking-wide uppercase">Markets</p>
      </div>

      {/* 시장 유형 */}
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-1">
        {isKo ? "유형" : "Type"}
      </p>
      <button
        onClick={() => pushParams({ mktType: "" })}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
          !mktType
            ? "bg-white text-amber-700 font-bold shadow-sm"
            : "text-slate-500 hover:bg-amber-50 hover:text-amber-700"
        )}
      >
        <Store className={cn("w-4 h-4 shrink-0", !mktType ? "text-amber-700" : "text-slate-400")} />
        {isKo ? "전체" : "All"}
      </button>
      {MARKET_TYPES.map((type) => {
        const isActive = mktType === type
        return (
          <button
            key={type}
            onClick={() => pushParams({ mktType: type })}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
              isActive
                ? "bg-white text-amber-700 font-bold shadow-sm"
                : "text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            <span className={cn("w-4 h-4 shrink-0 flex items-center justify-center text-[8px]",
              isActive ? "text-amber-600" : "text-slate-300")}>●</span>
            {type}
          </button>
        )
      })}

      <div className="border-t border-gray-100 my-3" />

      {/* 지역 */}
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-1">
        {isKo ? "지역" : "Region"}
      </p>
      <div className="relative" ref={regionRef}>
        <button
          onClick={() => setRegionOpen((v) => !v)}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
            region
              ? "bg-white text-amber-700 font-bold shadow-sm"
              : "text-slate-500 hover:bg-amber-50 hover:text-amber-700"
          )}
        >
          <MapPin className={cn("w-4 h-4 shrink-0", region ? "text-amber-700" : "text-slate-400")} />
          <span className="flex-1 truncate">{region || (isKo ? "전체 지역" : "All Regions")}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform",
            regionOpen && "rotate-180",
            region ? "text-amber-700" : "text-slate-400")} />
        </button>
        {regionOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
            <button
              onClick={() => { pushParams({ region: "" }); setRegionOpen(false) }}
              className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                !region ? "text-amber-700 font-bold bg-amber-50" : "text-slate-600 hover:bg-amber-50 hover:text-amber-700")}
            >
              {isKo ? "전체 지역" : "All Regions"}
            </button>
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => { pushParams({ region: r }); setRegionOpen(false) }}
                className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                  region === r
                    ? "text-amber-700 font-bold bg-amber-50"
                    : "text-slate-600 hover:bg-amber-50 hover:text-amber-700")}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasFilters && (
        <>
          <div className="border-t border-gray-100 my-3" />
          <button
            onClick={() => router.push(`/${locale}/markets`)}
            className="flex items-center gap-2 w-full rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {isKo ? "필터 초기화" : "Reset filters"}
          </button>
        </>
      )}
    </div>
  )
}
