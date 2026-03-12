"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import { Button } from "@/components/ui/button"

interface RecipeFiltersProps {
  locale: string
}

const CATEGORIES = ["반찬", "국", "탕", "찌개", "후식", "볶음", "구이", "조림"]

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

  const handleCategoryChange = (category: string) => {
    pushParams({ category: currentCategory === category ? "" : category })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat}
          variant={currentCategory === cat ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryChange(cat)}
        >
          {cat}
        </Button>
      ))}
    </div>
  )
}
