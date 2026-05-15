/**
 * 한국관광공사 TourAPI - 축제/공연/행사 동기화 스크립트 (searchFestival2)
 *
 * 실행: node --env-file=.env.local scripts/sync-festivals.mjs
 *
 * searchFestival2는 날짜 범위 기반 축제 전용 API로,
 * eventstartdate / eventenddate 필드가 포함됩니다.
 */

import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const API_KEY = process.env.PUBLIC_DATA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) { console.error("❌ PUBLIC_DATA_API_KEY 환경변수가 없습니다."); process.exit(1); }
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

function commonParams() {
  const p = new URLSearchParams();
  p.set("serviceKey", API_KEY);
  p.set("MobileOS", "ETC");
  p.set("MobileApp", "TripBite");
  p.set("_type", "json");
  return p;
}

// searchFestival2: 날짜 범위 + 지역코드로 축제 조회
async function fetchFestivalPage(eventStartDate, areaCode, pageNo, numOfRows = 1000) {
  const p = commonParams();
  p.set("eventStartDate", eventStartDate);
  p.set("areaCode", areaCode);
  p.set("pageNo", String(pageNo));
  p.set("numOfRows", String(numOfRows));
  p.set("arrange", "C"); // 수정일순

  const url = `${BASE_URL}/searchFestival2?${p.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} areaCode=${areaCode}`);

  const json = await res.json();
  const body = json.response?.body;
  if (!body) return { items: [], totalCount: 0 };

  const raw = body.items === "" ? [] : (body.items?.item ?? []);
  const items = Array.isArray(raw) ? raw : [raw];
  return { items, totalCount: Number(body.totalCount ?? 0) };
}

async function upsert(records) {
  const { error } = await supabase
    .from("festivals")
    .upsert(records, { onConflict: "content_id" });
  if (error) throw error;
}

async function main() {
  console.log("🎉 축제/행사 데이터 동기화 시작 (searchFestival2)...\n");

  const { error: tableErr } = await supabase.from("festivals").select("id").limit(1);
  if (tableErr) {
    console.error("⚠️  festivals 테이블이 없습니다.");
    process.exit(1);
  }

  // 2년 전부터 2년 후까지 범위로 검색 (과거 + 현재 + 예정 축제 포함)
  const today = new Date();
  const from = new Date(today);
  from.setFullYear(from.getFullYear() - 2);
  const eventStartDate = from.toISOString().slice(0, 10).replace(/-/g, "");

  let totalSynced = 0;
  const batch = [];
  const seen = new Set();

  for (const [tourAreaCode, legalAreaCode] of Object.entries(AREA_CODE_MAP)) {
    const { totalCount } = await fetchFestivalPage(eventStartDate, tourAreaCode, 1, 1);
    if (totalCount === 0) {
      console.log(`  지역 ${tourAreaCode}: 데이터 없음`);
      continue;
    }

    const pages = Math.ceil(totalCount / 100);
    console.log(`  지역 ${tourAreaCode}: ${totalCount}개 (${pages}페이지)`);

    for (let page = 1; page <= pages; page++) {
      const { items } = await fetchFestivalPage(eventStartDate, tourAreaCode, page, 100);

      for (const item of items) {
        const contentId = String(item.contentid);
        if (seen.has(contentId)) continue;
        seen.add(contentId);

        batch.push({
          content_id:       contentId,
          title:            item.title ?? "",
          image_url:        item.firstimage || item.firstimage2 || null,
          addr1:            item.addr1 ?? null,
          addr2:            item.addr2 || null,
          area_code:        legalAreaCode,
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

  console.log(`\n✅ 동기화 완료: 총 ${totalSynced}개 레코드 (중복 제거 후 ${seen.size}개 고유 축제)`);
}

main().catch((e) => {
  console.error("❌ 동기화 실패:", e);
  process.exit(1);
});
