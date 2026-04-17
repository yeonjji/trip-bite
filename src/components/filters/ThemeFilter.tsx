"use client"

import { TRAVEL_CONTENT_TYPES } from "@/lib/constants/content-types"

interface ThemeFilterProps {
  value: string
  onChange: (id: string) => void
  locale?: string
}

export default function ThemeFilter({ value, onChange, locale = "ko" }: ThemeFilterProps) {
  const isKo = locale === "ko"

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">{isKo ? "유형" : "Type"}</span>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 flex-nowrap">
          <button
            onClick={() => onChange("")}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              value === ""
                ? "bg-primary text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {isKo ? "전체" : "All"}
          </button>
          {TRAVEL_CONTENT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                value === type.id
                  ? "bg-primary text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {isKo ? type.nameKo : type.nameEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
