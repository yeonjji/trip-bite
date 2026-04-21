/**
 * 한국관광공사 TourAPI - 축제/공연/행사(contentTypeId=15) 동기화 스크립트
 *
 * 실행: node --env-file=.env.local scripts/sync-festivals.mjs
 *
 * 필요 환경변수 (.env.local):
 *   TOUR_API_KEY=...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const API_KEY = process.env.PUBLIC_DATA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) { console.error("❌ TOUR_API_KEY 환경변수가 없습니다."); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("❌ Supabase 환경변수가 없습니다."); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// TourAPI areaCode → 법정동 시도코드
const AREA_CODE_MAP = {
  "1": "11",    // 서울
  "2": "28",    // 인천
  "3": "30",    // 대전
  "4": "27",    // 대구
  "5": "29",    // 광주
  "6": "26",    // 부산
  "7": "31",    // 울산
  "8": "36110", // 세종
  "31": "41",   // 경기
  "32": "51",   // 강원
  "33": "43",   // 충북
  "34": "44",   // 충남
  "35": "47",   // 경북
  "36": "48",   // 경남
  "37": "52",   // 전북
  "38": "46",   // 전남
  "39": "50",   // 제주
};

const AREA_CODES = Object.keys(AREA_CODE_MAP);

function commonParams() {
  const p = new URLSearchParams();
  p.set("serviceKey", API_KEY);
  p.set("MobileOS", "ETC");
  p.set("MobileApp", "TripBite");
  p.set("_type", "json");
  return p;
}

async function fetchPage(areaCode, pageNo, numOfRows = 100) {
  const p = commonParams();
  p.set("contentTypeId", "15");
  p.set("areaCode", areaCode);
  p.set("pageNo", String(pageNo));
  p.set("numOfRows", String(numOfRows));
  p.set("arrange", "C"); // 수정일순

  const url = `${BASE_URL}/areaBasedList2?${p.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} areaCode=${areaCode} page=${pageNo}`);
  const json = await res.json();
  const body = json.response?.body;
  if (!body) return { items: [], totalCount: 0 };
  const raw = body.items === "" ? [] : (body.items?.item ?? []);
  const items = Array.isArray(raw) ? raw : [raw];
  return { items, totalCount: body.totalCount ?? 0 };
}

async function upsert(records) {
  const { error } = await supabase
    .from("festivals")
    .upsert(records, { onConflict: "content_id" });
  if (error) throw error;
}

async function main() {
  console.log("🎉 축제/행사 데이터 동기화 시작...");

  // 테이블 존재 확인
  const { error: tableErr } = await supabase.from("festivals").select("id").limit(1);
  if (tableErr) {
    console.error("⚠️  festivals 테이블이 없습니다. Supabase 대시보드에서 022_festivals.sql을 실행하세요.");
    process.exit(1);
  }

  let totalSynced = 0;
  const batch = [];

  for (const areaCode of AREA_CODES) {
    const { totalCount } = await fetchPage(areaCode, 1, 1);
    if (totalCount === 0) continue;

    const pages = Math.ceil(totalCount / 100);
    console.log(`  지역 ${areaCode}: ${totalCount}개 (${pages}페이지)`);

    for (let page = 1; page <= pages; page++) {
      const { items } = await fetchPage(areaCode, page, 100);

      for (const item of items) {
        batch.push({
          content_id:       String(item.contentid),
          title:            item.title ?? "",
          image_url:        item.firstimage || item.firstimage2 || null,
          addr1:            item.addr1 ?? null,
          addr2:            item.addr2 || null,
          area_code:        AREA_CODE_MAP[String(item.areacode)] ?? null,
          sigungu_code:     item.sigungucode ? String(item.sigungucode) : null,
          mapx:             item.mapx ? parseFloat(item.mapx) : null,
          mapy:             item.mapy ? parseFloat(item.mapy) : null,
          event_start_date: item.eventstartdate ? String(item.eventstartdate) : null,
          event_end_date:   item.eventenddate   ? String(item.eventenddate)   : null,
          updated_at:       new Date().toISOString(),
        });

        if (batch.length >= 50) {
          await upsert(batch.splice(0, 50));
          totalSynced += 50;
          process.stdout.write(`\r  진행: ${totalSynced}개 완료`);
        }
      }
    }
  }

  if (batch.length > 0) {
    await upsert(batch);
    totalSynced += batch.length;
  }

  console.log(`\n✅ 동기화 완료: 총 ${totalSynced}개 레코드`);
}

main().catch((e) => {
  console.error("❌ 동기화 실패:", e);
  process.exit(1);
});
