"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { SlidersHorizontal, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import BottomSheet from "@/components/shared/BottomSheet"

interface Props {
  regions: string[]
  locale: string
}

const STATUS_ITEMS = [
  { value: "ongoing", ko: "진행중", en: "Ongoing" },
  { value: "upcoming", ko: "예정", en: "Upcoming" },
  { value: "ended", ko: "종료", en: "Ended" },
]

export default function EventMobileFilters({ regions, locale }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isKo = locale === "ko"

  const [sheetOpen, setSheetOpen] = useState(false)

  const region = searchParams.get("region") ?? ""
  const status = searchParams.get("status") ?? ""

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete("page")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const activeFilterCount = [region].filter(Boolean).length
  const currentStatus = STATUS_ITEMS.find(s => s.value === status)

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
            onClick={() => pushParams({ status: "" })}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              !status ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
            )}
          >
            {isKo ? "전체" : "All"}
          </button>
          {STATUS_ITEMS.map((s) => (
            <button
              key={s.value}
              onClick={() => pushParams({ status: s.value })}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                status === s.value ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {isKo ? s.ko : s.en}
            </button>
          ))}
          {region && (
            <button
              onClick={() => pushParams({ region: "" })}
              className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-[#b05a42] text-white"
            >
              <MapPin className="w-3 h-3" />
              {region}
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
        onReset={() => { router.push(pathname); setSheetOpen(false) }}
        resetLabel={isKo ? "초기화" : "Reset"}
        applyLabel={isKo ? "적용하기" : "Apply"}
        onApply={() => setSheetOpen(false)}
      >
        {/* 상태 */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            {isKo ? "상태" : "Status"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => pushParams({ status: "" })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                !status ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {isKo ? "전체" : "All"}
            </button>
            {STATUS_ITEMS.map((s) => (
              <button
                key={s.value}
                onClick={() => pushParams({ status: s.value })}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  status === s.value ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                )}
              >
                {isKo ? s.ko : s.en}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        {regions.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
              {isKo ? "지역" : "Region"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => pushParams({ region: "" })}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-medium transition-colors text-center",
                  !region ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                )}
              >
                {isKo ? "전체" : "All"}
              </button>
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => pushParams({ region: r })}
                  className={cn(
                    "rounded-xl py-2.5 text-sm font-medium transition-colors text-center",
                    region === r ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
