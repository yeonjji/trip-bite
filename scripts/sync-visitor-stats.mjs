// 관광빅데이터 방문자수 데이터 수집 스크립트 (DataLabService)
// 실행: node --env-file=.env.local scripts/sync-visitor-stats.mjs [startYmd] [endYmd]
// 날짜 미지정 시 어제 하루치 수집
// 예시: node --env-file=.env.local scripts/sync-visitor-stats.mjs 20240101 20240131

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.PUBLIC_DATA_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !API_KEY) {
  console.error("필수 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_DATA_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE_URL = "https://apis.data.go.kr/B551011/DataLabService";
const NUM_OF_ROWS = 1000;

// 날짜 인자 파싱 (yyyyMMdd)
function resolveDateRange() {
  const [, , argStart, argEnd] = process.argv;
  if (argStart && argEnd) return { startYmd: argStart, endYmd: argEnd };
  if (argStart) return { startYmd: argStart, endYmd: argStart };

  // 기본값: 어제
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const ymd = yesterday.toISOString().slice(0, 10).replace(/-/g, "");
  return { startYmd: ymd, endYmd: ymd };
}

async function fetchPage(endpoint, startYmd, endYmd, pageNo) {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS: "ETC",
    MobileApp: "TripBite",
    _type: "json",
    numOfRows: String(NUM_OF_ROWS),
    pageNo: String(pageNo),
    startYmd,
    endYmd,
  });

  const res = await fetch(`${BASE_URL}/${endpoint}?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const data = await res.json();
  const header = data?.response?.header;

  if (header?.resultCode !== "0000") {
    throw new Error(`API 오류 [${header?.resultCode}]: ${header?.resultMsg}`);
  }

  const body = data?.response?.body;
  const raw = body?.items;
  const items = !raw || raw === "" ? [] : Array.isArray(raw.item) ? raw.item : [raw.item];
  return { items, totalCount: body?.totalCount ?? 0 };
}

async function fetchAll(endpoint, startYmd, endYmd) {
  const first = await fetchPage(endpoint, startYmd, endYmd, 1);
  const allItems = [...first.items];

  const totalPages = Math.ceil(first.totalCount / NUM_OF_ROWS);
  for (let p = 2; p <= totalPages; p++) {
    await new Promise((r) => setTimeout(r, 300));
    const { items } = await fetchPage(endpoint, startYmd, endYmd, p);
    allItems.push(...items);
  }

  return allItems;
}

async function upsertMetro(items) {
  if (items.length === 0) return 0;

  const rows = items.map((item) => ({
    area_code:    String(item.areaCode),
    area_nm:      item.areaNm,
    base_ymd:     `${item.baseYmd.slice(0, 4)}-${item.baseYmd.slice(4, 6)}-${item.baseYmd.slice(6, 8)}`,
    daywk_div_cd: String(item.daywkDivCd),
    daywk_div_nm: item.daywkDivNm,
    tou_div_cd:   String(item.touDivCd),
    tou_div_nm:   item.touDivNm,
    tou_num:      item.touNum,
    synced_at:    new Date().toISOString(),
  }));

  const BATCH = 200;
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error, count } = await supabase
      .from("visitor_stats_metro")
      .upsert(rows.slice(i, i + BATCH), { onConflict: "area_code,base_ymd,tou_div_cd", count: "exact" });
    if (error) throw error;
    total += count ?? 0;
  }
  return total;
}

async function upsertLocal(items) {
  if (items.length === 0) return 0;

  const rows = items.map((item) => ({
    signgu_code:  String(item.signguCode),
    signgu_nm:    item.signguNm,
    base_ymd:     `${item.baseYmd.slice(0, 4)}-${item.baseYmd.slice(4, 6)}-${item.baseYmd.slice(6, 8)}`,
    daywk_div_cd: String(item.daywkDivCd),
    daywk_div_nm: item.daywkDivNm,
    tou_div_cd:   String(item.touDivCd),
    tou_div_nm:   item.touDivNm,
    tou_num:      item.touNum,
    synced_at:    new Date().toISOString(),
  }));

  const BATCH = 200;
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error, count } = await supabase
      .from("visitor_stats_local")
      .upsert(rows.slice(i, i + BATCH), { onConflict: "signgu_code,base_ymd,tou_div_cd", count: "exact" });
    if (error) throw error;
    total += count ?? 0;
  }
  return total;
}

async function main() {
  const { startYmd, endYmd } = resolveDateRange();
  console.log(`관광빅데이터 방문자수 수집: ${startYmd} ~ ${endYmd}\n`);

  // 광역 지자체
  console.log("[1/2] 광역 지자체 방문자수 수집 중...");
  const metroItems = await fetchAll("metcoRegnVisitrDDList", startYmd, endYmd);
  console.log(`  → ${metroItems.length}건 수집`);
  const metroCount = await upsertMetro(metroItems);
  console.log(`  → ${metroCount}건 upsert 완료\n`);

  // 기초 지자체
  console.log("[2/2] 기초 지자체 방문자수 수집 중...");
  const localItems = await fetchAll("locgoRegnVisitrDDList", startYmd, endYmd);
  console.log(`  → ${localItems.length}건 수집`);
  const localCount = await upsertLocal(localItems);
  console.log(`  → ${localCount}건 upsert 완료\n`);

  console.log(`완료! 광역 ${metroCount}건 + 기초 ${localCount}건`);
}

main().catch((err) => {
  console.error("오류:", err.message);
  process.exit(1);
});
