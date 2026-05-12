import { createClient } from "@/lib/supabase/server"
import type { MarketItem, MarketFilterParams, NearbyMarket } from "@/types/market"

function mapRow(row: Record<string, unknown>): MarketItem {
  return {
    mktId:        row.mkt_id as string,
    mktNm:        row.mkt_nm as string,
    rdnAdr:       (row.rdn_adr as string)       || null,
    lnmAdr:       (row.lnm_adr as string)       || null,
    sidoNm:       (row.sido_nm as string)       || null,
    sggNm:        (row.sgg_nm as string)        || null,
    mktTpNm:      (row.mkt_tp_nm as string)     || null,
    parkingYn:    (row.parking_yn as string)    || null,
    lat:          row.lat  != null ? Number(row.lat)  : null,
    lng:          row.lng  != null ? Number(row.lng)  : null,
    telNo:        (row.tel_no as string)        || null,
    storNumber:   (row.stor_number as string)   || null,
    trtmntPrdlst: (row.trtmnt_prdlst as string) || null,
    estblYear:    (row.estbl_year as string)    || null,
    mrktCycle:    (row.mrkt_cycle as string)    || null,
  }
}

export async function getMarkets(params: MarketFilterParams): Promise<{
  items: MarketItem[]
  totalCount: number
}> {
  const { region = "", mktType = "", search = "", page = 1 } = params
  const pageSize = 12
  const supabase = await createClient()

  let query = supabase.from("traditional_markets").select("*", { count: "exact" })

  if (region)  query = query.eq("sido_nm", region)
  if (mktType) query = query.eq("mkt_tp_nm", mktType)
  if (search)  query = query.ilike("mkt_nm", `%${search}%`)

  query = query.order("mkt_nm", { ascending: true })

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count } = await query
  if (!data) return { items: [], totalCount: 0 }

  return {
    items: data.map(mapRow),
    totalCount: count ?? 0,
  }
}

export async function getMarketById(mktId: string): Promise<MarketItem | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("traditional_markets")
    .select("*")
    .eq("mkt_id", mktId)
    .single()
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function getMarketRegions(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("traditional_markets")
    .select("sido_nm")
    .not("sido_nm", "is", null)
  if (!data) return []
  const regions = new Set(data.map((r) => r.sido_nm as string).filter(Boolean))
  return Array.from(regions).sort()
}

export async function getMarketTypes(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("traditional_markets")
    .select("mkt_tp_nm")
    .not("mkt_tp_nm", "is", null)
  if (!data) return []
  const types = new Set(data.map((r) => r.mkt_tp_nm as string).filter(Boolean))
  return Array.from(types).sort()
}

export async function getNearbyMarkets(
  lat: number,
  lng: number,
  radiusMeters = 5000,
  limit = 5
): Promise<NearbyMarket[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_nearby_traditional_markets", {
    p_lat: lat,
    p_lng: lng,
    radius_meters: radiusMeters,
    result_limit: limit,
  })
  return (data ?? []) as NearbyMarket[]
}
