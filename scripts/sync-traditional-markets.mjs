/**
 * 소상공인시장진흥공단 전통시장 정보 동기화 스크립트
 *
 * 실행: node --env-file=.env.local scripts/sync-traditional-markets.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"

const BASE_URL = "https://api.data.go.kr/openapi/tn_pubr_public_trdit_mrkt_api"
const API_KEY = process.env.PUBLIC_DATA_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!API_KEY) { console.error("❌ PUBLIC_DATA_API_KEY 환경변수가 없습니다."); process.exit(1) }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("❌ Supabase 환경변수가 없습니다."); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function makeMktId(mrktNm, rdnmadr, lnmadr) {
  const key = `${mrktNm}|${rdnmadr || lnmadr || ""}`
  return createHash("md5").update(key).digest("hex")
}

function parseAddr(addr) {
  const parts = (addr || "").split(" ").filter(Boolean)
  return { sidoNm: parts[0] || null, sggNm: parts[1] || null }
}

async function fetchPage(pageNo, numOfRows = 1000) {
  const p = new URLSearchParams()
  p.set("serviceKey", API_KEY)
  p.set("pageNo", String(pageNo))
  p.set("numOfRows", String(numOfRows))
  p.set("type", "json")

  const res = await fetch(`${BASE_URL}?${p.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  const body = json.response?.body
  if (!body) return { items: [], totalCount: 0 }

  const raw = body.items === "" ? [] : (body.items ?? [])
  const items = Array.isArray(raw) ? raw : [raw]
  return { items, totalCount: Number(body.totalCount ?? 0) }
}

async function upsert(records) {
  const { error } = await supabase
    .from("traditional_markets")
    .upsert(records, { onConflict: "mkt_id" })
  if (error) throw error
}

async function main() {
  console.log("🏪 전통시장 데이터 동기화 시작...\n")

  const { error: tableErr } = await supabase.from("traditional_markets").select("id").limit(1)
  if (tableErr) {
    console.error("⚠️  traditional_markets 테이블이 없습니다. 먼저 마이그레이션을 실행하세요.")
    process.exit(1)
  }

  const { totalCount } = await fetchPage(1, 1)
  if (totalCount === 0) {
    console.log("데이터가 없습니다.")
    return
  }

  const pages = Math.ceil(totalCount / 1000)
  console.log(`총 ${totalCount}개 (${pages}페이지)\n`)

  let totalSynced = 0
  const batch = []

  for (let page = 1; page <= pages; page++) {
    const { items } = await fetchPage(page, 1000)
    console.log(`  페이지 ${page}/${pages}: ${items.length}개 수신`)

    for (const item of items) {
      const rdnmadr = item.rdnmadr || ""
      const lnmadr  = item.lnmadr  || ""
      const addr = rdnmadr || lnmadr
      const { sidoNm, sggNm } = parseAddr(addr)

      batch.push({
        mkt_id:        makeMktId(item.mrktNm, rdnmadr, lnmadr),
        mkt_nm:        item.mrktNm        ?? "",
        rdn_adr:       rdnmadr            || null,
        lnm_adr:       lnmadr             || null,
        sido_nm:       sidoNm,
        sgg_nm:        sggNm,
        mkt_tp_nm:     item.mrktType      || null,
        parking_yn:    item.prkplceYn     || null,
        lat:           item.latitude  ? parseFloat(item.latitude)  : null,
        lng:           item.longitude ? parseFloat(item.longitude) : null,
        tel_no:        item.phoneNumber   || null,
        stor_number:   item.storNumber    || null,
        trtmnt_prdlst: item.trtmntPrdlst  || null,
        estbl_year:    item.estblYear     || null,
        mrkt_cycle:    item.mrktEstblCycle || null,
        updated_at:    new Date().toISOString(),
      })

      if (batch.length >= 50) {
        await upsert(batch.splice(0, 50))
        totalSynced += 50
        process.stdout.write(`\r  진행: ${totalSynced}개 완료`)
      }
    }
  }

  if (batch.length > 0) {
    await upsert(batch)
    totalSynced += batch.length
  }

  console.log(`\n✅ 동기화 완료: 총 ${totalSynced}개 레코드`)
}

main().catch((e) => {
  console.error("❌ 동기화 실패:", e)
  process.exit(1)
})
