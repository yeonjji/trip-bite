"use client"

import { useRouter, usePathname } from "next/navigation"

interface EventFiltersProps {
  region: string
  status: string
  regions: string[]
  locale: string
}

const STATUS_OPTIONS = [
  { value: "", ko: "전체", en: "All" },
  { value: "ongoing", ko: "진행중", en: "Ongoing" },
  { value: "upcoming", ko: "예정", en: "Upcoming" },
  { value: "ended", ko: "종료", en: "Ended" },
]

const pill = (active: boolean) =>
  `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-primary text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
  }`

export default function EventFilters({ region, status, regions, locale }: EventFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isKo = locale === "ko"

  function buildUrl(params: { region?: string; status?: string }) {
    const sp = new URLSearchParams()
    const nextRegion = params.region !== undefined ? params.region : region
    const nextStatus = params.status !== undefined ? params.status : status
    if (nextRegion) sp.set("region", nextRegion)
    if (nextStatus) sp.set("status", nextStatus)
    const qs = sp.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-foreground">{isKo ? "상태" : "Status"}</span>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 flex-nowrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={pill(status === opt.value)}
                onClick={() => router.push(buildUrl({ status: opt.value }))}
              >
                {isKo ? opt.ko : opt.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {regions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-foreground">{isKo ? "지역" : "Regions"}</span>
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2 flex-nowrap">
              <button
                className={pill(region === "")}
                onClick={() => router.push(buildUrl({ region: "" }))}
              >
                {isKo ? "전체" : "All"}
              </button>
              {regions.map((r) => (
                <button
                  key={r}
                  className={pill(region === r)}
                  onClick={() => router.push(buildUrl({ region: r }))}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
