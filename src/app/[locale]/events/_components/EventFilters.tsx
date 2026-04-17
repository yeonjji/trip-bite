"use client"

import { useRouter, usePathname } from "next/navigation"

interface EventFiltersProps {
  region: string
  regions: string[]
  locale: string
}

const pill = (active: boolean) =>
  `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-primary text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
  }`

export default function EventFilters({ region, regions, locale }: EventFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isKo = locale === "ko"

  function buildUrl(nextRegion: string) {
    const sp = new URLSearchParams()
    if (nextRegion) sp.set("region", nextRegion)
    const qs = sp.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  if (regions.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">{isKo ? "지역" : "Regions"}</span>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 flex-nowrap">
          <button
            className={pill(region === "")}
            onClick={() => router.push(buildUrl(""))}
          >
            {isKo ? "전체" : "All"}
          </button>
          {regions.map((r) => (
            <button
              key={r}
              className={pill(region === r)}
              onClick={() => router.push(buildUrl(r))}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
