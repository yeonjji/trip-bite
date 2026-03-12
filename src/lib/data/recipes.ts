import { createClient } from "@/lib/supabase/server"
import type { RecipeRow } from "@/types/database"

export async function getRecipes(params: {
  category?: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<{ items: RecipeRow[]; totalCount: number }> {
  const { category, keyword, page = 1, pageSize = 12 } = params

  const supabase = await createClient()

  let query = supabase.from("recipes").select("*", { count: "exact" })

  if (category) {
    query = query.eq("category", category)
  }

  if (keyword) {
    query = query.ilike("name", `%${keyword}%`)
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
