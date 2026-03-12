"use client"

import { Button } from "@/components/ui/button"
import { AREA_CODES } from "@/lib/constants/area-codes"

interface RegionFilterProps {
  value: string
  onChange: (code: string) => void
  locale?: string
}

export default function RegionFilter({ value, onChange, locale = "ko" }: RegionFilterProps) {
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
      {AREA_CODES.map((area) => (
        <Button
          key={area.code}
          variant={value === area.code ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(area.code)}
        >
          {isKo ? area.nameKo : area.nameEn}
        </Button>
      ))}
    </div>
  )
}
