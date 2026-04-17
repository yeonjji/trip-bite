"use client"

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

const pill = (active: boolean) =>
  `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-primary text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
  }`

export default function Cat3Filter({ value, onChange, locale = "ko" }: Cat3FilterProps) {
  const isKo = locale === "ko"

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">{isKo ? "음식 종류" : "Cuisine"}</span>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 flex-nowrap">
          <button className={pill(value === "")} onClick={() => onChange("")}>
            {isKo ? "전체" : "All"}
          </button>
          {RESTAURANT_CAT3.map((cat) => (
            <button key={cat.id} className={pill(value === cat.id)} onClick={() => onChange(cat.id)}>
              {isKo ? cat.nameKo : cat.nameEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
