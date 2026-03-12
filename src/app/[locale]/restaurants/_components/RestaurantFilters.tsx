"use client"

import { useRouter, useSearchParams } from "next/navigation"

import RegionFilter from "@/components/filters/RegionFilter"

interface RestaurantFiltersProps {
  locale: string
}

export default function RestaurantFilters({ locale }: RestaurantFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const areaCode = searchParams.get("areaCode") ?? ""

  function handleAreaChange(code: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (code) {
      params.set("areaCode", code)
    } else {
      params.delete("areaCode")
    }
    params.delete("page")
    router.push(`/${locale}/restaurants?${params.toString()}`)
  }

  return <RegionFilter value={areaCode} onChange={handleAreaChange} locale={locale} />
}
