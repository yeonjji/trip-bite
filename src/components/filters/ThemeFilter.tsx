"use client"

import { Button } from "@/components/ui/button"
import { TRAVEL_CONTENT_TYPES } from "@/lib/constants/content-types"

interface ThemeFilterProps {
  value: string
  onChange: (id: string) => void
  locale?: string
}

export default function ThemeFilter({ value, onChange, locale = "ko" }: ThemeFilterProps) {
  const isKo = locale === "ko"

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={value === "" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("")}
      >
        {isKo ? "전체" : "All"}
      </Button>
      {TRAVEL_CONTENT_TYPES.map((type) => (
        <Button
          key={type.id}
          variant={value === type.id ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(type.id)}
        >
          {isKo ? type.nameKo : type.nameEn}
        </Button>
      ))}
    </div>
  )
}
