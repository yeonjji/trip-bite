"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

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
    <div className="flex flex-wrap gap-2 mt-2">
      <Button
        variant={value === "" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("")}
      >
        {isKo ? "전체" : "All"}
      </Button>
      {list.map((s) => (
        <Button
          key={s.area_code}
          variant={value === s.area_code ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(s.area_code)}
        >
          {isKo ? s.name_ko : s.name_en}
        </Button>
      ))}
    </div>
  )
}
