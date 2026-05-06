import { createClient } from "@/lib/supabase/server"
import type { FestivalItem, FestivalStatus, FestivalFilterParams } from "@/types/festival"

const AREA_CODE_TO_REGION: Record<string, string> = {
  "11": "서울",
  "26": "부산",
  "27": "대구",
  "28": "인천",
  "29": "광주",
  "30": "대전",
  "31": "울산",
  "36110": "세종",
  "41": "경기",
  "51": "강원",
  "43": "충북",
  "44": "충남",
  "47": "경북",
  "48": "경남",
  "52": "전북",
  "46": "전남",
  "50": "제주",
}

export function getRegionName(areaCode: string): string {
  return AREA_CODE_TO_REGION[areaCode] ?? ""
}

export function computeStatus(item: FestivalItem): FestivalStatus {
  const today = new Date()
  const todayStr =
    String(today.getFullYear()) +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0")
  if (!item.eventStartDate || !item.eventEndDate) return "upcoming"
  if (todayStr < item.eventStartDate) return "upcoming"
  if (todayStr > item.eventEndDate) return "ended"
  return "ongoing"
}

function mapRow(row: Record<string, unknown>): FestivalItem {
  return {
    contentId: row.content_id as string,
    title: row.title as string,
    imageUrl: (row.image_url as string) || null,
    addr1: (row.addr1 as string) || "",
    addr2: (row.addr2 as string) || null,
    areaCode: (row.area_code as string) || "",
    sigunguCode: (row.sigungu_code as string) || null,
    mapx: row.mapx != null ? Number(row.mapx) : null,
    mapy: row.mapy != null ? Number(row.mapy) : null,
    eventStartDate: (row.event_start_date as string) || "",
    eventEndDate: (row.event_end_date as string) || "",
  }
}

export async function getFestivalRegions(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("festivals").select("area_code")
  if (!data) return []
  const regions = new Set(
    data.map((r) => AREA_CODE_TO_REGION[r.area_code as string]).filter(Boolean)
  )
  return Array.from(regions).sort()
}

export async function getFestivals(params: FestivalFilterParams): Promise<{
  items: FestivalItem[]
  totalCount: number
}> {
  const { region = "", status = "", search = "", page = 1 } = params
  const pageSize = 12
  const supabase = await createClient()

  const today = new Date()
  const todayStr =
    String(today.getFullYear()) +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0")

  let query = supabase.from("festivals").select("*", { count: "exact" })

  if (region) {
    const areaCode = Object.entries(AREA_CODE_TO_REGION).find(([, v]) => v === region)?.[0]
    if (areaCode) query = query.eq("area_code", areaCode)
  }

  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  if (status === "ongoing") {
    query = query
      .lte("event_start_date", todayStr)
      .gte("event_end_date", todayStr)
      .order("event_end_date", { ascending: true })
  } else if (status === "upcoming") {
    query = query
      .gt("event_start_date", todayStr)
      .order("event_start_date", { ascending: true })
  } else if (status === "ended") {
    query = query
      .lt("event_end_date", todayStr)
      .order("event_end_date", { ascending: false })
  } else {
    // 기본: event_end_date DESC 정렬 → 종료 안 된 축제(큰 날짜)가 위로
    query = query
      .order("event_end_date", { ascending: false })
      .order("event_start_date", { ascending: true })
  }

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count } = await query
  if (!data) return { items: [], totalCount: 0 }

  return {
    items: data.map(mapRow),
    totalCount: count ?? 0,
  }
}

export async function getUpcomingFestivals(limit = 4): Promise<FestivalItem[]> {
  const supabase = await createClient()
  const today = new Date()
  const todayStr =
    String(today.getFullYear()) +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0")

  const { data } = await supabase
    .from("festivals")
    .select("*")
    .gte("event_end_date", todayStr)
    .order("event_start_date", { ascending: true })
    .limit(limit)

  if (!data) return []
  return data.map(mapRow)
}

export async function getFestivalById(contentId: string): Promise<FestivalItem | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("festivals")
    .select("*")
    .eq("content_id", contentId)
    .single()
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}
