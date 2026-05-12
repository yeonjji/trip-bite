/**
 * 소상공인시장진흥공단 상가정보 사전 수집 스크립트
 * 실행: node --env-file=.env.local scripts/sync-nearby-shops.mjs
 *
 * destinations 테이블에서 좌표 있는 관광지 기준으로 주변 상점 데이터를 사전 캐싱합니다.
 */

import { createClient } from "@supabase/supabase-js"

const BASE_URL = "https://apis.data.go.kr/B553077/api/open/sdsc2"
const API_KEY = process.env.PUBLIC_DATA_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!API_KEY) { console.error("❌ PUBLIC_DATA_API_KEY 환경변수가 없습니다."); process.exit(1) }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("❌ Supabase 환경변수가 없습니다."); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
// 실제 API 코드 체계 (B553077)
const MART_SCD = new Set(["G20404", "G20405"])   // 슈퍼마켓, 편의점
const PHARMACY_SCD = new Set(["G21501"])           // 약국
const CAFE_MCD = new Set(["I212"])                 // 비알코올(카페)

function resolveCategoryGroup(indsLclsCd, indsMclsCd, indsSclsCd) {
  if (MART_SCD.has(indsSclsCd)) return "mart"
  if (PHARMACY_SCD.has(indsSclsCd)) return "pharmacy"
  if (CAFE_MCD.has(indsMclsCd)) return "cafe"
  if (indsLclsCd === "I2") return "restaurant"
  if (indsLclsCd === "S2") return "convenience"
  return null
}

async function fetchShopsInRadius(cx, cy) {
  const params = new URLSearchParams()
  params.set("serviceKey", API_KEY)
  params.set("cx", String(cx))
  params.set("cy", String(cy))
  params.set("radius", "1000")
  params.set("numOfRows", "1000")
  params.set("pageNo", "1")
  params.set("type", "json")

  const res = await fetch(`${BASE_URL}/storeListInRadius?${params.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  if (data?.header?.resultCode !== "00") return []
  const items = data?.body?.items
  if (!items || items === "") return []
  return Array.isArray(items) ? items : [items]
}

async function processBatch(coords) {
  const records = []
  const now = new Date().toISOString()

  for (const { lat, lng } of coords) {
    try {
      const shops = await fetchShopsInRadius(lng, lat)

      for (const shop of shops) {
        const categoryGroup = resolveCategoryGroup(shop.indsLclsCd, shop.indsMclsCd, shop.indsSclsCd)
        if (!categoryGroup) continue

        const shopLat = parseFloat(shop.lat)
        const shopLng = parseFloat(shop.lon)
        if (isNaN(shopLat) || isNaN(shopLng)) continue

        records.push({
          bizes_id:       shop.bizesId,
          bizes_nm:       shop.bizesNm,
          brch_nm:        shop.brchNm || null,
          inds_lcls_cd:   shop.indsLclsCd,
          inds_lcls_nm:   shop.indsLclsNm,
          inds_mcls_cd:   shop.indsMclsCd,
          inds_mcls_nm:   shop.indsMclsNm,
          inds_scls_cd:   shop.indsSclsCd,
          inds_scls_nm:   shop.indsSclsNm,
          category_group: categoryGroup,
          rdnm_adr:       shop.rdnmAdr || null,
          lno_adr:        shop.lnoAdr || null,
          lat:            shopLat,
          lng:            shopLng,
          cached_at:      now,
        })
      }
      await new Promise(r => setTimeout(r, 200))
    } catch (err) {
      console.warn(`  ⚠️  (${lat},${lng}) 조회 실패:`, err.message)
    }
  }

  return records
}

async function main() {
  console.log("🏪 소상공인 상가 사전 수집 시작...\n")

  const LIMIT = parseInt(process.env.SYNC_LIMIT ?? "200", 10)

  const { data: destinations, error } = await supabase
    .from("destinations")
    .select("id, title, mapx, mapy")
    .not("mapx", "is", null)
    .not("mapy", "is", null)
    .order("rating_avg", { ascending: false })
    .limit(LIMIT)

  if (error) { console.error("❌ destinations 조회 실패:", error.message); process.exit(1) }
  if (!destinations?.length) { console.log("데이터가 없습니다."); return }

  console.log(`총 ${destinations.length}개 관광지 처리 예정\n`)

  const coords = destinations.map(d => ({
    lat: parseFloat(d.mapy),
    lng: parseFloat(d.mapx),
  })).filter(c => !isNaN(c.lat) && !isNaN(c.lng))

  let totalUpserted = 0

  for (let i = 0; i < coords.length; i += 10) {
    const batch = coords.slice(i, i + 10)
    process.stdout.write(`  처리 중 ${i + 1}~${Math.min(i + 10, coords.length)}/${coords.length}...`)

    const records = await processBatch(batch)

    if (records.length > 0) {
      // 배치 내 동일 bizes_id 중복 제거 (여러 좌표 반경이 겹칠 때 발생)
      const deduped = [...new Map(records.map(r => [r.bizes_id, r])).values()]
      const { error: upsertErr } = await supabase
        .from("nearby_shops")
        .upsert(deduped, { onConflict: "bizes_id" })
      if (upsertErr) {
        console.error("\n❌ upsert 실패:", upsertErr.message)
      } else {
        totalUpserted += records.length
        console.log(` ${records.length}개 저장`)
      }
    } else {
      console.log(" 데이터 없음")
    }
  }

  console.log(`\n✅ 완료: 총 ${totalUpserted}개 상점 데이터 저장`)
}

main().catch(err => { console.error("❌ 오류:", err); process.exit(1) })
