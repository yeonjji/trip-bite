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
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ items: SpecialtyWithRegion[]; totalCount: number }> {
  const { areaCode, category, season, search, page = 1, pageSize = 12 } = params

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

  if (search) {
    query = query.ilike("name", `%${search}%`)
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

// 향토음식 시도 전체명 → DB 약칭 매핑
const SIDO_SHORT: Record<string, string> = {
  "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구",
  "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전",
  "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기",
  "강원도": "강원", "강원특별자치도": "강원", "충청북도": "충북",
  "충청남도": "충남", "전라북도": "전북", "전북특별자치도": "전북",
  "전라남도": "전남", "경상북도": "경북", "경상남도": "경남",
  "제주특별자치도": "제주",
}

export async function getSpecialtiesByRegionName(
  regionFullName: string,
  limit = 4
): Promise<SpecialtyWithRegion[]> {
  const supabase = await createClient()
  const dbName = SIDO_SHORT[regionFullName] ?? regionFullName

  const { data, error } = await supabase
    .from("specialties")
    .select("*, regions(area_code, name_ko, name_en)")
    .eq("regions.name_ko", dbName)
    .not("image_url", "is", null)
    .limit(limit)

  if (error) return []
  return ((data ?? []).filter((r) => r.regions !== null)) as SpecialtyWithRegion[]
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
