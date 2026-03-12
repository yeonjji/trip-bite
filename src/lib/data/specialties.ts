// P2-08: 특산품 데이터 레이어 (Supabase specialties + regions join)

import { createClient } from "@/lib/supabase/server"
import type { SpecialtyRow } from "@/types/database"

type SpecialtyWithRegion = SpecialtyRow & {
  regions: { area_code: string; name_ko: string; name_en: string }
}

export async function getSpecialties(params: {
  areaCode?: string
  category?: string
  season?: string
  page?: number
  pageSize?: number
}): Promise<{ items: SpecialtyWithRegion[]; totalCount: number }> {
  const { areaCode, category, season, page = 1, pageSize = 12 } = params

  const supabase = await createClient()

  let query = supabase
    .from("specialties")
    .select("*, regions(area_code, name_ko, name_en)", { count: "exact" })
    .order("created_at", { ascending: false })

  if (category) {
    query = query.eq("category", category)
  }

  if (season) {
    query = query.contains("season", [season])
  }

  if (areaCode) {
    query = query.eq("regions.area_code", areaCode)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error("specialties fetch error:", error.message)
    return { items: [], totalCount: 0 }
  }

  // areaCode 필터 시 regions join 결과가 null인 행 제거
  const items = (data ?? []).filter(
    (row) => !areaCode || row.regions !== null
  ) as SpecialtyWithRegion[]

  return {
    items,
    totalCount: count ?? 0,
  }
}

export async function getSpecialtyDetail(id: string): Promise<{
  specialty: SpecialtyWithRegion | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("specialties")
    .select("*, regions(area_code, name_ko, name_en)")
    .eq("id", id)
    .single()

  if (error && error.code !== "PGRST116") {
    throw new Error(`특산품 상세 조회 실패: ${error.message}`)
  }

  return {
    specialty: (data as SpecialtyWithRegion) ?? null,
  }
}
