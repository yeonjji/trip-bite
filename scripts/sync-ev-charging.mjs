/**
 * 전기차 충전기 정보 동기화 스크립트 (한국환경공단 B552584)
 *
 * 실행: node --env-file=.env.local scripts/sync-ev-charging.mjs
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   PUBLIC_DATA_API_KEY=...
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.PUBLIC_DATA_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  process.exit(1);
}
if (!API_KEY) {
  console.error("❌ PUBLIC_DATA_API_KEY 환경변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BASE_URL = "https://apis.data.go.kr/B552584/EvCharger/getChargerInfo";
const NUM_OF_ROWS = 1000;

function parseXml(xml) {
  const totalCountMatch = xml.match(/<totalCount>(\d+)<\/totalCount>/);
  const totalCount = totalCountMatch ? parseInt(totalCountMatch[1], 10) : 0;

  const resultCodeMatch = xml.match(/<resultCode>(\w+)<\/resultCode>/);
  const resultCode = resultCodeMatch?.[1] ?? "??";
  if (resultCode !== "00") {
    const msgMatch = xml.match(/<resultMsg>([^<]+)<\/resultMsg>/);
    throw new Error(`API 오류 [${resultCode}]: ${msgMatch?.[1] ?? ""}`);
  }

  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  const items = itemBlocks.map((m) => {
    const obj = {};
    for (const [, k, v] of m[1].matchAll(/<(\w+)>([^<]*)<\/\1>/g)) {
      obj[k] = v === "null" ? "" : v;
    }
    return obj;
  });

  return { items, totalCount };
}

async function fetchPage(pageNo, retries = 3) {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    pageNo: String(pageNo),
    numOfRows: String(NUM_OF_ROWS),
  });
  const url = `${BASE_URL}?${params}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const text = await res.text();
      return parseXml(text);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  ⚠️  페이지 ${pageNo} 재시도 ${attempt}/${retries - 1}...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

function toRow(c) {
  return {
    stat_id:      c.statId      || c.stat_id      || "",
    chger_id:     c.chgerId     || c.chger_id     || "",
    stat_nm:      c.statNm      || c.stat_nm      || "",
    chger_type:   c.chgerType   || c.chger_type   || null,
    addr:         c.addr        || null,
    lat:          c.lat         ? parseFloat(c.lat) : null,
    lng:          c.lng         ? parseFloat(c.lng) : null,
    use_time:     c.useTime     || c.use_time     || null,
    busi_id:      c.busiId      || c.busi_id      || null,
    bnm:          c.bnm         || null,
    busi_nm:      c.busiNm      || c.busi_nm      || null,
    busi_call:    c.busiCall    || c.busi_call    || null,
    output:       c.output      || null,
    method:       c.method      || null,
    zcode:        c.zcode       || null,
    zscode:       c.zscode      || null,
    kind:         c.kind        || null,
    kind_detail:  c.kindDetail  || c.kind_detail  || null,
    parking_free: c.parkingFree || c.parking_free || null,
    limit_yn:     c.limitYn     || c.limit_yn     || null,
    limit_detail: c.limitDetail || c.limit_detail || null,
    del_yn:       c.delYn       || c.del_yn       || null,
    note:         c.note        || null,
    synced_at:    new Date().toISOString(),
  };
}

async function main() {
  console.log("⚡ 전기차 충전기 데이터 동기화 시작...");

  const first = await fetchPage(1);
  const total = first.totalCount;
  console.log(`📊 총 ${total.toLocaleString()}개 충전기`);

  const pages = Math.ceil(total / NUM_OF_ROWS);
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (let page = 1; page <= pages; page++) {
    const { items } = page === 1 ? first : await fetchPage(page);

    const rows = items
      .filter((c) => (c.delYn || c.del_yn) !== "Y")
      .map(toRow)
      .filter((r) => r.stat_id && r.chger_id);

    skipped += items.length - rows.length;

    // 배치 내 중복 제거
    const deduped = Array.from(
      new Map(rows.map((r) => [`${r.stat_id}:${r.chger_id}`, r])).values()
    );

    if (deduped.length > 0) {
      const { error } = await supabase
        .from("ev_chargers")
        .upsert(deduped, { onConflict: "stat_id,chger_id" });

      if (error) {
        console.error(`❌ 페이지 ${page} 오류:`, error.message);
        errors++;
      } else {
        synced += deduped.length;
      }
    }

    if (page % 20 === 0 || page === pages) {
      console.log(`  진행: ${page}/${pages} (${synced.toLocaleString()}개 완료)`);
    }
  }

  console.log(`✅ 완료: ${synced.toLocaleString()}개 동기화, 삭제 건너뜀: ${skipped}, 오류: ${errors}`);
}

main().catch(console.error);
