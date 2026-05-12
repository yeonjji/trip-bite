"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import BottomSheet from "@/components/shared/BottomSheet"

const CATEGORY_GROUPS = [
  { value: "", label: "전체" },
  { value: "밥/주식", label: "밥/주식" },
  { value: "국/찌개", label: "국/찌개" },
  { value: "반찬/부식", label: "반찬/부식" },
  { value: "일품", label: "일품" },
  { value: "후식/떡/과자", label: "후식/떡/과자" },
  { value: "발효식품", label: "발효식품" },
  { value: "기타", label: "기타" },
]

interface Props {
  locale: string
}

export default function RecipeMobileFilters({ locale }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isKo = locale === "ko"

  const [sheetOpen, setSheetOpen] = useState(false)
  const currentCategory = searchParams.get("category") ?? ""

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete("page")
    router.push(`/${locale}/recipes?${params.toString()}`)
  }

  const activeFilterCount = currentCategory ? 1 : 0

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
          {CATEGORY_GROUPS.map(({ value, label }) => (
            <button
              key={value || "all"}
              onClick={() => pushParams({ category: value })}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                currentCategory === value ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sheet (카테고리만 있어 단순하게 구성) */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={isKo ? "카테고리 선택" : "Select Category"}
        onReset={() => { pushParams({ category: "" }); setSheetOpen(false) }}
        resetLabel={isKo ? "초기화" : "Reset"}
        applyLabel={isKo ? "적용하기" : "Apply"}
        onApply={() => setSheetOpen(false)}
      >
        <div className="mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
            {isKo ? "카테고리" : "Category"}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORY_GROUPS.map(({ value, label }) => (
              <button
                key={value || "all"}
                onClick={() => pushParams({ category: value })}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                  currentCategory === value ? "bg-[#b05a42] text-white" : "bg-stone-100 text-stone-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
