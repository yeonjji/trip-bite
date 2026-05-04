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

const CATEGORY_COLOR: Record<string, string> = {
  농산물: "bg-green-100 text-green-700",
  수산물: "bg-blue-100 text-blue-700",
  축산물: "bg-red-100 text-red-700",
  가공식품: "bg-amber-100 text-amber-700",
  공예품: "bg-purple-100 text-purple-700",
  기타: "bg-gray-100 text-gray-700",
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
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🛒</span>
        <h2 className="font-headline text-base font-bold text-[#1B1C1A]">이 지역 특산품</h2>
        {regionName && (
          <span className="text-xs text-muted-foreground">{regionName} 대표 먹거리</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {specialties.map((s) => {
          const icon = CATEGORY_ICON[s.category] ?? "📦"
          const badgeColor = CATEGORY_COLOR[s.category] ?? "bg-gray-100 text-gray-700"
          return (
            <div
              key={s.id}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EF] text-xl leading-none">
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#1B1C1A]">{s.name_ko}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor}`}>
                    {s.category}
                  </span>
                </div>
                {s.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                )}
                {s.regions && (
                  <p className="mt-1 text-xs text-[#D84315]/70">
                    📍 {s.regions.name_ko}의 대표 {s.category}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
