"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { MapPin, ChevronDown, CalendarDays, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  regions: string[]
  locale: string
}

const STATUS_ITEMS = [
  { value: "ongoing", ko: "진행중", en: "Ongoing" },
  { value: "upcoming", ko: "예정", en: "Upcoming" },
  { value: "ended", ko: "종료", en: "Ended" },
]

export default function EventFilters({ regions, locale }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isKo = locale === "ko"

  const region = searchParams.get("region") ?? ""
  const status = searchParams.get("status") ?? ""

  const [regionOpen, setRegionOpen] = useState(false)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, val]) => {
      if (val) params.set(key, val)
      else params.delete(key)
    })
    params.delete("page")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const hasFilters = region || status

  return (
    <div className="flex flex-col gap-0.5">
      <div className="mb-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Navigation</p>
        <p className="text-xs font-bold text-slate-700 tracking-wide uppercase">Events</p>
      </div>

      {/* 상태 — nav 리스트 */}
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-1">
        {isKo ? "상태" : "Status"}
      </p>
      <button
        onClick={() => pushParams({ status: "" })}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
          !status
            ? "bg-white text-orange-700 font-bold shadow-sm"
            : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
        )}
      >
        <CalendarDays className={cn("w-4 h-4 shrink-0", !status ? "text-orange-700" : "text-slate-400")} />
        {isKo ? "전체" : "All"}
      </button>
      {STATUS_ITEMS.map((s) => {
        const isActive = status === s.value
        return (
          <button
            key={s.value}
            onClick={() => pushParams({ status: s.value })}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left",
              isActive
                ? "bg-white text-orange-700 font-bold shadow-sm"
                : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
            )}
          >
            <span className={cn("w-4 h-4 shrink-0 flex items-center justify-center text-[8px]",
              isActive ? "text-orange-600" : "text-slate-300")}>●</span>
            {isKo ? s.ko : s.en}
          </button>
        )
      })}

      {regions.length > 0 && (
        <>
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
                region
                  ? "bg-white text-orange-700 font-bold shadow-sm"
                  : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
              )}
            >
              <MapPin className={cn("w-4 h-4 shrink-0", region ? "text-orange-700" : "text-slate-400")} />
              <span className="flex-1 truncate">{region || (isKo ? "전체 지역" : "All Regions")}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform",
                regionOpen && "rotate-180",
                region ? "text-orange-700" : "text-slate-400")} />
            </button>
            {regionOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { pushParams({ region: "" }); setRegionOpen(false) }}
                  className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                    !region ? "text-orange-700 font-bold bg-orange-50" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
                >
                  {isKo ? "전체 지역" : "All Regions"}
                </button>
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => { pushParams({ region: r }); setRegionOpen(false) }}
                    className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors",
                      region === r
                        ? "text-orange-700 font-bold bg-orange-50"
                        : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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
