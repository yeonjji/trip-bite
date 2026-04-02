import { createClient } from "@/lib/supabase/server"
import type { RecipeRow } from "@/types/database"

// 통합 카테고리 그룹 → DB 카테고리 값 매핑
export const CATEGORY_GROUPS: Record<string, string[]> = {
  "밥/주식": ["밥", "주식류"],
  "국/찌개": ["국&찌개"],
  "반찬/부식": ["반찬", "부식류"],
  "일품": ["일품"],
  "후식/떡/과자": ["후식", "떡류", "다과류"],
  "발효식품": ["발효식품류"],
  "기타": ["기타"],
}

export async function getRecipes(params: {
  category?: string
  keyword?: string
  source?: string
  page?: number
  pageSize?: number
}): Promise<{ items: RecipeRow[]; totalCount: number }> {
  const { category, keyword, source, page = 1, pageSize = 12 } = params

  const supabase = await createClient()

  let query = supabase.from("recipes").select("*", { count: "exact" })

  if (category) {
    const groupValues = CATEGORY_GROUPS[category]
    if (groupValues) {
      query = query.in("category", groupValues)
    } else {
      query = query.eq("category", category)
    }
  }

  if (keyword) {
    query = query.ilike("name", `%${keyword}%`)
  }

  if (source) {
    query = query.eq("source", source)
  }

  query = query.order("created_at", { ascending: false })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error("recipes fetch error:", error.message)
    return { items: [], totalCount: 0 }
  }

  return {
    items: (data as RecipeRow[]) ?? [],
    totalCount: count ?? 0,
  }
}

export async function getRecipeDetail(id: string): Promise<RecipeRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("recipe detail fetch error:", error.message)
    return null
  }

  return (data as RecipeRow) ?? null
}

export async function getRecipesBySpecialty(specialtyId: string): Promise<RecipeRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("specialty_id", specialtyId)

  if (error) {
    console.error("recipes by specialty fetch error:", error.message)
    return []
  }

  return (data as RecipeRow[]) ?? []
}
