"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import { Button } from "@/components/ui/button"

interface RecipeFiltersProps {
  locale: string
}

const CATEGORY_GROUPS = [
  { value: "", label: "전체" },
  { value: "밥/주식", label: "밥/주식" },
  { value: "국/찌개", label: "국/찌개" },
  { value: "반찬/부식", label: "반찬/부식" },
  { value: "일품", label: "일품" },
  { value: "후식/떡/과자", label: "후식/떡/과자" },
  { value: "발효식품", label: "발효식품" },
  { value: "기타", label: "기타" },
]

export default function RecipeFilters({ locale }: RecipeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get("category") ?? ""

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
      router.push(`/${locale}/recipes?${params.toString()}`)
    },
    [router, searchParams, locale]
  )

  const handleCategoryGroupChange = (category: string) => {
    pushParams({ category })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_GROUPS.map(({ value, label }) => (
        <Button
          key={value || "all-cat"}
          variant={currentCategory === value ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryGroupChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
