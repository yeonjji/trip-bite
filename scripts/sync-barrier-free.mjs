/**
 * 한국관광공사 무장애 여행 정보 동기화 스크립트
 *
 * 실행: node scripts/sync-barrier-free.mjs
 *
 * 필요 환경변수 (.env.local):
 *   TOUR_API_KEY=...            (기존 TourAPI 키로 KorWithService 사용 가능)
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * API: https://apis.data.go.kr/B551011/KorWithService
 */

// 실행: node --env-file=.env.local scripts/sync-barrier-free.mjs

import { createClient } from "@supabase/supabase-js";

const BARRIER_FREE_BASE_URL = "https://apis.data.go.kr/B551011/KorWithService2";
const API_KEY = process.env.PUBLIC_DATA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) {
  console.error("❌ TOUR_API_KEY 환경변수가 없습니다.");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 구형 TourAPI area code → regions 테이블 area_code 매핑
const AREA_CODE_MAP = {
  "1": "11",   // 서울
  "2": "28",   // 인천
  "3": "30",   // 대전
  "4": "27",   // 대구
  "5": "29",   // 광주
  "6": "26",   // 부산
  "7": "31",   // 울산
  "8": "36110",// 세종
  "31": "41",  // 경기
  "32": "51",  // 강원
  "33": "43",  // 충북
  "34": "44",  // 충남
  "35": "47",  // 경북
  "36": "48",  // 경남
  "37": "52",  // 전북
  "38": "46",  // 전남
  "39": "50",  // 제주
};

function mapAreaCode(code) {
  if (!code) return null;
  return AREA_CODE_MAP[String(code)] ?? null;
}

function commonParams() {
  const p = new URLSearchParams();
  p.set("serviceKey", API_KEY);
  p.set("MobileOS", "ETC");
  p.set("MobileApp", "TripBite");
  p.set("_type", "json");
  return p;
}

async function fetchList(pageNo = 1, numOfRows = 100) {
  const p = commonParams();
  p.set("pageNo", String(pageNo));
  p.set("numOfRows", String(numOfRows));

  const url = `${BARRIER_FREE_BASE_URL}/areaBasedList2?${p.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching page ${pageNo}`);
  const json = await res.json();
  const body = json.response?.body;
  if (!body) return { items: [], totalCount: 0 };
  const items = body.items === "" ? [] : (body.items?.item ?? []);
  return { items: Array.isArray(items) ? items : [items], totalCount: body.totalCount ?? 0 };
}

async function fetchWithTourDetail(contentId) {
  const p = commonParams();
  p.set("contentId", contentId);
  const url = `${BARRIER_FREE_BASE_URL}/detailWithTour2?${p.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const items = json.response?.body?.items;
    if (!items || items === "") return null;
    const item = Array.isArray(items.item) ? items.item[0] : items.item;
    return item ?? null;
  } catch {
    return null;
  }
}

async function upsertPlaces(records) {
  const { error } = await supabase
    .from("barrier_free_places")
    .upsert(records, { onConflict: "content_id" });
  if (error) throw error;
}

async function ensureTable() {
  const { error } = await supabase.from("barrier_free_places").select("id").limit(1);
  if (error) {
    console.error("⚠️  barrier_free_places 테이블이 없습니다.");
    console.log(`
Supabase 대시보드에서 아래 SQL을 실행하세요:

CREATE TABLE barrier_free_places (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id       text NOT NULL UNIQUE,
  content_type_id  text,
  title            text NOT NULL,
  addr1            text NOT NULL DEFAULT '',
  addr2            text,
  area_code        text NOT NULL DEFAULT '',
  sigungu_code     text,
  mapx             float8,
  mapy             float8,
  first_image      text,
  first_image2     text,
  tel              text,
  homepage         text,
  overview         text,
  wheelchair       text,
  exit_accessible  text,
  restroom_wh      text,
  elevator         text,
  parking_wh       text,
  braileblock      text,
  signguide        text,
  audioguide       text,
  rating_avg       float8 NOT NULL DEFAULT 0,
  rating_count     int    NOT NULL DEFAULT 0,
  cached_at        timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON barrier_free_places (area_code);
CREATE INDEX ON barrier_free_places (rating_avg DESC);
    `);
    process.exit(1);
  }
}

async function main() {
  console.log("♿ 무장애 여행 데이터 동기화 시작...");
  await ensureTable();

  const first = await fetchList(1, 1);
  const total = first.totalCount;
  const pages = Math.ceil(total / 100);
  console.log(`  총 ${total}개 레코드, ${pages}페이지`);

  const batch = [];
  let synced = 0;

  for (let page = 1; page <= pages; page++) {
    const { items } = await fetchList(page, 100);

    for (const item of items) {
      const detail = await fetchWithTourDetail(item.contentid);

      batch.push({
        content_id: item.contentid,
        content_type_id: item.contenttypeid ?? null,
        title: item.title ?? "",
        addr1: item.addr1 ?? "",
        addr2: item.addr2 ?? null,
        area_code: mapAreaCode(item.areacode),
        sigungu_code: item.sigungucode ?? null,
        mapx: item.mapx ? parseFloat(item.mapx) : null,
        mapy: item.mapy ? parseFloat(item.mapy) : null,
        first_image: item.firstimage ?? null,
        first_image2: item.firstimage2 ?? null,
        tel: item.tel ?? null,
        homepage: item.homepage ?? null,
        overview: item.overview ?? null,
        wheelchair: detail?.wheelchair ?? null,
        exit_accessible: detail?.exit ?? null,
        restroom_wh: detail?.restroom ?? null,
        elevator: detail?.elevator ?? null,
        parking_wh: detail?.parkingwheelchair ?? null,
        braileblock: detail?.braileblock ?? null,
        signguide: detail?.signguide ?? null,
        audioguide: detail?.audioguide ?? null,
        rating_avg: 0,
        rating_count: 0,
        cached_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (batch.length >= 50) {
        await upsertPlaces(batch.splice(0, 50));
        synced += 50;
        process.stdout.write(`\r  진행: ${synced}/${total}`);
      }
    }
  }

  if (batch.length > 0) {
    await upsertPlaces(batch);
    synced += batch.length;
  }

  console.log(`\n✅ 동기화 완료: 총 ${synced}개 레코드`);
}

main().catch((e) => {
  console.error("❌ 동기화 실패:", e);
  process.exit(1);
});
