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

  // 이미지 있는 항목 먼저
  query = query.order("main_image_url", { ascending: false, nullsFirst: false })
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

export interface ScoredRecipe {
  recipe: RecipeRow
  reason: string
}

const CAMPING_METHODS = ["볶음", "구이", "무침", "찌기", "삶기", "끓이기", "조림"]
const CAMPING_CATEGORIES = ["일품", "국&찌개"]

const SEASON_KEYWORDS: Record<string, string[]> = {
  spring: ["나물", "봄", "쑥", "달래", "냉이"],
  summer: ["냉", "수박", "콩국", "오이", "가지"],
  autumn: ["전", "송편", "고구마", "버섯", "밤"],
  winter: ["김치", "동치미", "호박죽", "굴", "시래기"],
}

function getCurrentSeason(): keyof typeof SEASON_KEYWORDS {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return "spring"
  if (month >= 6 && month <= 8) return "summer"
  if (month >= 9 && month <= 11) return "autumn"
  return "winter"
}

function scoreRecipe(
  recipe: RecipeRow,
  context: "camping" | "festival" | "restaurant" | "travel" | "general",
  regionName?: string | null,
  menuKeywords?: string[],
  specialtyIds?: string[],
): { score: number; reason: string } {
  let score = 0
  let reason = ""

  const name = recipe.name ?? ""
  const category = recipe.category ?? ""
  const method = recipe.cooking_method ?? ""
  const ingredients = recipe.ingredients ?? ""
  const tags: string[] = Array.isArray(recipe.hash_tags) ? recipe.hash_tags : []

  // 지역 특산품 연결 레시피 (최우선)
  if (specialtyIds && specialtyIds.length > 0 && recipe.specialty_id && specialtyIds.includes(recipe.specialty_id)) {
    score += 5
    reason = "이 지역 특산 재료로 만든 레시피"
  }

  // 지역명 매칭
  if (regionName) {
    if (tags.includes(regionName)) {
      score += 3
      if (!reason) reason = `${regionName}의 향토 음식`
    } else if (name.includes(regionName)) {
      score += 2
      if (!reason) reason = `${regionName} 대표 음식`
    }
  }

  // 다중 키워드 매칭
  for (const kw of menuKeywords ?? []) {
    if (name.includes(kw)) {
      score += 3
      if (!reason) reason = `${kw} 레시피`
    } else if (tags.some((t) => t.includes(kw))) {
      score += 2
      if (!reason) reason = `${kw} 관련 레시피`
    } else if (ingredients.includes(kw)) {
      score += 1
      if (!reason) reason = `${kw}을(를) 활용한 레시피`
    }
  }

  if (context === "camping") {
    const methodMatch = CAMPING_METHODS.find((m) => method.includes(m))
    if (methodMatch) {
      score += 2
      if (!reason) reason = `캠핑에 어울리는 ${methodMatch} 요리`
    }
    if (CAMPING_CATEGORIES.includes(category)) {
      score += 1
      if (!reason) reason = "캠핑에 딱 좋은 든든한 요리"
    }
  }

  if (context === "festival" || context === "travel") {
    const season = getCurrentSeason()
    const seasonWords = SEASON_KEYWORDS[season]
    const seasonMatch = seasonWords.find((w) => name.includes(w) || tags.includes(w))
    if (seasonMatch) {
      score += 2
      if (!reason) {
        const seasonLabel = { spring: "봄", summer: "여름", autumn: "가을", winter: "겨울" }[season]
        reason = `${seasonLabel} 계절에 어울리는 음식`
      }
    }
  }

  if (!reason) {
    if (category) reason = `${category} 추천 레시피`
    else reason = "함께 즐기기 좋은 레시피"
  }

  return { score, reason }
}

export async function getRelatedRecipes({
  regionName,
  areaCode,
  context = "general",
  menuKeywords,
  limit = 3,
}: {
  regionName?: string | null
  areaCode?: string | null
  context?: "camping" | "festival" | "restaurant" | "travel" | "general"
  menuKeywords?: string[]
  limit?: number
}): Promise<ScoredRecipe[]> {
  const supabase = await createClient()
  const POOL = 20

  // 지역 특산품 연결 레시피 ID 목록 사전 조회 (specialty 체인)
  let linkedSpecialtyIds: string[] = []
  if (areaCode) {
    const { data: region } = await supabase
      .from("regions")
      .select("id")
      .eq("area_code", areaCode)
      .maybeSingle()
    if (region?.id) {
      const { data: specs } = await supabase
        .from("specialties")
        .select("id")
        .eq("region_id", region.id)
      linkedSpecialtyIds = (specs ?? []).map((s: { id: string }) => s.id)
    }
  }

  const queries: Promise<{ data: unknown[] | null }>[] = []

  // Pool 1: 지역 특산품과 직접 연결된 레시피 (가장 강한 신호)
  if (linkedSpecialtyIds.length > 0) {
    queries.push(
      supabase
        .from("recipes")
        .select("*")
        .in("specialty_id", linkedSpecialtyIds)
        .limit(POOL) as unknown as Promise<{ data: unknown[] | null }>,
    )
  }

  // Pool 2: 지역명 hash_tags / 이름 매칭
  if (regionName) {
    queries.push(
      supabase
        .from("recipes")
        .select("*")
        .contains("hash_tags", [regionName])
        .limit(POOL) as unknown as Promise<{ data: unknown[] | null }>,
      supabase
        .from("recipes")
        .select("*")
        .ilike("name", `%${regionName}%`)
        .limit(POOL) as unknown as Promise<{ data: unknown[] | null }>,
    )
  }

  // Pool 3: 키워드 매칭 (이름, 재료)
  for (const kw of menuKeywords ?? []) {
    queries.push(
      supabase
        .from("recipes")
        .select("*")
        .or(`name.ilike.%${kw}%,ingredients.ilike.%${kw}%`)
        .limit(POOL) as unknown as Promise<{ data: unknown[] | null }>,
      supabase
        .from("recipes")
        .select("*")
        .contains("hash_tags", [kw])
        .limit(POOL) as unknown as Promise<{ data: unknown[] | null }>,
    )
  }

  // Pool 4: 캠핑 컨텍스트 카테고리
  if (context === "camping") {
    queries.push(
      supabase
        .from("recipes")
        .select("*")
        .in("category", CAMPING_CATEGORIES)
        .limit(POOL) as unknown as Promise<{ data: unknown[] | null }>,
    )
  }

  // Fallback: 최신순
  queries.push(
    supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(POOL) as unknown as Promise<{ data: unknown[] | null }>,
  )

  const results = await Promise.allSettled(queries)
  const merged: RecipeRow[] = []
  const seen = new Set<string>()

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.data) {
      for (const row of result.value.data as RecipeRow[]) {
        if (!seen.has(row.id)) {
          seen.add(row.id)
          merged.push(row)
        }
      }
    }
  }

  const scored = merged
    .map((recipe) => {
      const { score, reason } = scoreRecipe(recipe, context, regionName, menuKeywords, linkedSpecialtyIds)
      return { recipe, reason, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored.map(({ recipe, reason }) => ({ recipe, reason }))
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
