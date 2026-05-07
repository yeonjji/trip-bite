/**
 * 한국관광공사 관광빅데이터 DataLabService 방문자 통계 동기화 스크립트
 *
 * 실행: node --env-file=.env.local scripts/sync-visitor-stats.mjs
 * 특정 연월 지정: node --env-file=.env.local scripts/sync-visitor-stats.mjs 202503
 *
 * 필요 환경변수 (.env.local):
 *   TOUR_API_KEY=...              (공공데이터포털 - 기존 키 공유)
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * 수집 대상:
 *   - 광역시도별 월별 방문자 수 (metcoRegnVisitrMonthList)
 *   - 시군구별 월별 방문자 수   (ldngVisitrMonthList)
 *
 * 업데이트 주기: 매월 17일 전월 데이터 업데이트됨
 */

import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://apis.data.go.kr/B551011/DataLabService";
const API_KEY = process.env.TOUR_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY)       { console.error("❌ TOUR_API_KEY 없음"); process.exit(1); }
if (!SUPABASE_URL)  { console.error("❌ NEXT_PUBLIC_SUPABASE_URL 없음"); process.exit(1); }
if (!SUPABASE_KEY)  { console.error("❌ SUPABASE_SERVICE_ROLE_KEY 없음"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DataLabService areaCode (구형 TourAPI 코드) → 법정동 코드 매핑
const AREA_CODE_MAP = {
  "1":  "11",    // 서울
  "2":  "28",    // 인천
  "3":  "30",    // 대전
  "4":  "27",    // 대구
  "5":  "29",    // 광주
  "6":  "26",    // 부산
  "7":  "31",    // 울산
  "8":  "36110", // 세종
  "31": "41",    // 경기
  "32": "51",    // 강원
  "33": "43",    // 충북
  "34": "44",    // 충남
  "35": "47",    // 경북
  "36": "48",    // 경남
  "37": "52",    // 전북
  "38": "46",    // 전남
  "39": "50",    // 제주
};

const AREA_CODES = Object.keys(AREA_CODE_MAP);

// 기준 연월 결정: 인자 없으면 전월 자동 계산
function resolveBaseYm(arg) {
  if (arg && /^\d{6}$/.test(arg)) return arg;
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function commonParams() {
  const p = new URLSearchParams();
  p.set("serviceKey", API_KEY);
  p.set("MobileOS", "ETC");
  p.set("MobileApp", "TripBite");
  p.set("_type", "json");
  p.set("numOfRows", "100");
  p.set("pageNo", "1");
  return p;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`JSON 파싱 실패: ${text.slice(0, 200)}`);
  }
}

function toArray(val) {
  if (!val || val === "") return [];
  return Array.isArray(val) ? val : [val];
}

// 광역시도별 월별 방문자 수
async function fetchMetroMonthly(areaCode, baseYm) {
  const p = commonParams();
  p.set("areaCode", areaCode);
  p.set("baseYm", baseYm);
  const url = `${BASE_URL}/metcoRegnVisitrMonthList?${p}`;
  try {
    const json = await fetchJson(url);
    return toArray(json?.response?.body?.items?.item);
  } catch (e) {
    console.warn(`  ⚠️  광역 ${areaCode} ${baseYm} 조회 실패:`, e.message);
    return [];
  }
}

// 시군구별 월별 방문자 수
async function fetchSigunguMonthly(areaCode, baseYm) {
  const p = commonParams();
  p.set("areaCode", areaCode);
  p.set("baseYm", baseYm);
  const url = `${BASE_URL}/ldngVisitrMonthList?${p}`;
  try {
    const json = await fetchJson(url);
    return toArray(json?.response?.body?.items?.item);
  } catch (e) {
    console.warn(`  ⚠️  시군구 ${areaCode} ${baseYm} 조회 실패:`, e.message);
    return [];
  }
}

async function upsert(records) {
  const { error } = await supabase
    .from("region_visitor_stats")
    .upsert(records, { onConflict: "area_code,sigungu_code,base_ym" });
  if (error) throw error;
}

async function main() {
  const baseYm = resolveBaseYm(process.argv[2]);
  console.log(`\n📊 관광빅데이터 방문자 통계 수집`);
  console.log(`   기준 연월: ${baseYm}`);
  console.log(`   대상: 광역 ${AREA_CODES.length}개 + 시군구\n`);

  let metroCount = 0;
  let sigunguCount = 0;
  const batch = [];

  for (const apiCode of AREA_CODES) {
    const areaCode = AREA_CODE_MAP[apiCode];
    process.stdout.write(`  ${areaCode} 조회 중...`);

    // 광역 단위 (sigungu_code = null)
    const metroItems = await fetchMetroMonthly(apiCode, baseYm);
    for (const item of metroItems) {
      const count = Number(item.touNum ?? item.visitCnt ?? item.visitNum ?? 0);
      if (!count) continue;
      batch.push({
        area_code:    areaCode,
        sigungu_code: null,
        base_ym:      baseYm,
        visitor_count: count,
      });
      metroCount++;
    }

    // 시군구 단위
    const sigunguItems = await fetchSigunguMonthly(apiCode, baseYm);
    for (const item of sigunguItems) {
      const sigunguCode = item.signguCode ?? item.sigunguCode ?? null;
      const count = Number(item.touNum ?? item.visitCnt ?? item.visitNum ?? 0);
      if (!sigunguCode || !count) continue;
      batch.push({
        area_code:     areaCode,
        sigungu_code:  String(sigunguCode),
        base_ym:       baseYm,
        visitor_count: count,
      });
      sigunguCount++;
    }

    process.stdout.write(` 광역 ${metroItems.length}건 / 시군구 ${sigunguItems.length}건\n`);

    // 배치 크기 도달 시 upsert
    if (batch.length >= 100) {
      await upsert(batch.splice(0, batch.length));
    }
  }

  if (batch.length > 0) {
    await upsert(batch);
  }

  console.log(`\n✅ 완료`);
  console.log(`   광역 집계: ${metroCount}건`);
  console.log(`   시군구 집계: ${sigunguCount}건`);
  console.log(`   합계: ${metroCount + sigunguCount}건\n`);
}

main().catch((e) => {
  console.error("❌ 동기화 실패:", e.message);
  process.exit(1);
});
