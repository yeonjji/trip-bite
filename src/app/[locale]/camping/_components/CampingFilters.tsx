"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import CampingFilter from "@/components/filters/CampingFilter"
import RegionFilter from "@/components/filters/RegionFilter"
import { AREA_CODES } from "@/lib/constants/area-codes"

interface CampingFiltersProps {
  locale: string
}

// area code → doNm 매핑 (고캠핑 API doNm 기준)
const CODE_TO_DONM: Record<string, string> = {
  "1": "서울특별시",
  "2": "인천광역시",
  "3": "대전광역시",
  "4": "대구광역시",
  "5": "광주광역시",
  "6": "부산광역시",
  "7": "울산광역시",
  "8": "세종특별자치시",
  "31": "경기도",
  "32": "강원도",
  "33": "충청북도",
  "34": "충청남도",
  "35": "전라북도",
  "36": "전라남도",
  "37": "경상북도",
  "38": "경상남도",
  "39": "제주특별자치도",
}

const DONM_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_TO_DONM).map(([code, doNm]) => [doNm, code])
)

export default function CampingFilters({ locale }: CampingFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const doNm = searchParams.get("doNm") ?? ""
  const induty = searchParams.get("induty") ?? ""
  const animalCmgCl = searchParams.get("animalCmgCl") ?? ""

  const regionCode = DONM_TO_CODE[doNm] ?? ""

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, val]) => {
        if (val) {
          params.set(key, val)
        } else {
          params.delete(key)
        }
      })
      params.delete("page")
      router.push(`/${locale}/camping?${params.toString()}`)
    },
    [router, searchParams, locale]
  )

  const handleRegionChange = (code: string) => {
    pushParams({ doNm: CODE_TO_DONM[code] ?? "" })
  }

  const handleIndutyChange = (val: string) => {
    pushParams({ induty: val })
  }

  const handleAnimalChange = (val: string) => {
    pushParams({ animalCmgCl: val })
  }

  return (
    <div className="flex flex-col gap-6">
      <RegionFilter value={regionCode} onChange={handleRegionChange} locale={locale} />
      <CampingFilter
        induty={induty}
        animal={animalCmgCl}
        onIndutyChange={handleIndutyChange}
        onAnimalChange={handleAnimalChange}
      />
    </div>
  )
}
