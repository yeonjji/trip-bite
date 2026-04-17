"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface SigunguItem {
  area_code: string
  name_ko: string
  name_en: string
}

interface SigunguFilterProps {
  areaCode: string
  value: string
  onChange: (code: string) => void
  locale?: string
}

export default function SigunguFilter({
  areaCode,
  value,
  onChange,
  locale = "ko",
}: SigunguFilterProps) {
  const [list, setList] = useState<SigunguItem[]>([])
  const isKo = locale === "ko"

  useEffect(() => {
    if (!areaCode) {
      setList([])
      return
    }
    const sb = createClient()
    sb.from("regions")
      .select("area_code, name_ko, name_en")
      .eq("parent_area_code", areaCode)
      .order("name_ko")
      .then(({ data }) => setList((data as SigunguItem[]) ?? []))
  }, [areaCode])

  if (!list.length) return null

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">{isKo ? "시/군/구" : "District"}</span>
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
          {list.map((s) => (
            <button
              key={s.area_code}
              onClick={() => onChange(s.area_code)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                value === s.area_code
                  ? "bg-primary text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {isKo ? s.name_ko : s.name_en}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
