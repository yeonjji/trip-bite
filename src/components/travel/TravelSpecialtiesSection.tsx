import type { SpecialtyRow } from "@/types/database"

type SpecialtyWithRegion = SpecialtyRow & {
  regions: { area_code: string; name_ko: string; name_en: string }
}

const CATEGORY_ICON: Record<string, string> = {
  농산물: "🌾",
  수산물: "🐟",
  축산물: "🥩",
  가공식품: "🏺",
  공예품: "🎨",
  기타: "📦",
}

export default function TravelSpecialtiesSection({
  specialties,
  regionName,
}: {
  specialties: SpecialtyWithRegion[]
  regionName: string | null
}) {
  if (specialties.length === 0) return null

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-headline text-base font-bold text-[#1B1C1A]">이 지역 특산품</h2>
        {regionName && (
          <span className="text-xs text-muted-foreground">{regionName} 대표 먹거리</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {specialties.map((s) => {
          const icon = CATEGORY_ICON[s.category] ?? "📦"
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl bg-[#F9F7EF] px-4 py-3"
            >
              <span className="text-xl leading-none">{icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1B1C1A]">{s.name_ko}</p>
                {s.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {s.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full border border-gray-100 bg-white px-2 py-0.5 text-xs text-[#5A413A]">
                {s.category}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
