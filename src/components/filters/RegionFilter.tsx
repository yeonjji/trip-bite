"use client"

import { cn } from "@/lib/utils"
import { AREA_CODES } from "@/lib/constants/area-codes"

interface RegionFilterProps {
  value: string
  onChange: (code: string) => void
  locale?: string
  variant?: "horizontal" | "sidebar"
}

export default function RegionFilter({ value, onChange, locale = "ko", variant = "horizontal" }: RegionFilterProps) {
  const isKo = locale === "ko"
  const isSidebar = variant === "sidebar"

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">{isKo ? "지역" : "Region"}</span>
      {isSidebar ? (
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onChange("")}
            className={cn(
              "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors text-center",
              value === "" ? "bg-[#14b8a6] text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            {isKo ? "전체" : "All"}
          </button>
          {AREA_CODES.map((area) => (
            <button
              key={area.code}
              onClick={() => onChange(area.code)}
              className={cn(
                "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors text-center",
                value === area.code ? "bg-[#14b8a6] text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              {isKo ? area.nameKo : area.nameEn}
            </button>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 flex-nowrap">
            <button
              onClick={() => onChange("")}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                value === "" ? "bg-primary text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              {isKo ? "전체" : "All"}
            </button>
            {AREA_CODES.map((area) => (
              <button
                key={area.code}
                onClick={() => onChange(area.code)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  value === area.code ? "bg-primary text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                {isKo ? area.nameKo : area.nameEn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
