"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import CampingFilter from "@/components/filters/CampingFilter"
import RegionFilter from "@/components/filters/RegionFilter"
import { AREA_CODES } from "@/lib/constants/area-codes"

interface CampingFiltersProps {
  locale: string
}

// area code → doNm 매핑 (법정동 코드 기준, 고캠핑 API doNm 값)
const CODE_TO_DONM: Record<string, string> = {
  "11": "서울특별시",
  "28": "인천광역시",
  "30": "대전광역시",
  "27": "대구광역시",
  "29": "광주광역시",
  "26": "부산광역시",
  "31": "울산광역시",
  "36110": "세종특별자치시",
  "41": "경기도",
  "51": "강원도",
  "43": "충청북도",
  "44": "충청남도",
  "52": "전라북도",
  "46": "전라남도",
  "47": "경상북도",
  "48": "경상남도",
  "50": "제주특별자치도",
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
