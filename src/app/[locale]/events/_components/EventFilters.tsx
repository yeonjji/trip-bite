"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={status === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => router.push(buildUrl({ status: opt.value }))}
          >
            {isKo ? opt.ko : opt.en}
          </Button>
        ))}
      </div>
      {regions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={region === "" ? "default" : "outline"}
            size="sm"
            onClick={() => router.push(buildUrl({ region: "" }))}
          >
            {isKo ? "전체 지역" : "All Regions"}
          </Button>
          {regions.map((r) => (
            <Button
              key={r}
              variant={region === r ? "default" : "outline"}
              size="sm"
              onClick={() => router.push(buildUrl({ region: r }))}
            >
              {r}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
