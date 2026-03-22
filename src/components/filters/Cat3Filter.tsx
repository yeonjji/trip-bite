"use client"

import { Button } from "@/components/ui/button"

const RESTAURANT_CAT3 = [
  { id: "A05020100", nameKo: "한식", nameEn: "Korean" },
  { id: "A05020200", nameKo: "서양식", nameEn: "Western" },
  { id: "A05020300", nameKo: "일식", nameEn: "Japanese" },
  { id: "A05020400", nameKo: "중식", nameEn: "Chinese" },
  { id: "A05020900", nameKo: "카페/전통찻집", nameEn: "Cafe & Tea" },
]

interface Cat3FilterProps {
  value: string
  onChange: (cat3: string) => void
  locale?: string
}

export default function Cat3Filter({ value, onChange, locale = "ko" }: Cat3FilterProps) {
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
      {RESTAURANT_CAT3.map((cat) => (
        <Button
          key={cat.id}
          variant={value === cat.id ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(cat.id)}
        >
          {isKo ? cat.nameKo : cat.nameEn}
        </Button>
      ))}
    </div>
  )
}
