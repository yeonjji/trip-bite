// 한국천문연구원 일출몰 정보 수집 스크립트
// 실행: node --env-file=.env.local scripts/sync-rise-set.mjs [startYmd] [endYmd]
// 날짜 미지정 시 오늘 포함 30일치 수집
// 예시: node --env-file=.env.local scripts/sync-rise-set.mjs 20250101 20251231

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.PUBLIC_DATA_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !API_KEY) {
  console.error("필수 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_DATA_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE_URL = "https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getLCRiseSetInfo";

// 시도별 대표 좌표 (법정동 코드 기준)
const AREAS = [
  { areaCode: "11", areaNm: "서울",   longitude: "126.9780", latitude: "37.5665" },
  { areaCode: "26", areaNm: "부산",   longitude: "129.0756", latitude: "35.1796" },
  { areaCode: "27", areaNm: "대구",   longitude: "128.6014", latitude: "35.8714" },
  { areaCode: "28", areaNm: "인천",   longitude: "126.7052", latitude: "37.4563" },
  { areaCode: "29", areaNm: "광주",   longitude: "126.8514", latitude: "35.1595" },
  { areaCode: "30", areaNm: "대전",   longitude: "127.3845", latitude: "36.3504" },
  { areaCode: "31", areaNm: "울산",   longitude: "129.3114", latitude: "35.5384" },
  { areaCode: "36", areaNm: "세종",   longitude: "127.2890", latitude: "36.4800" },
  { areaCode: "41", areaNm: "경기",   longitude: "127.0090", latitude: "37.4138" },
  { areaCode: "42", areaNm: "강원",   longitude: "127.7269", latitude: "37.8813" },
  { areaCode: "43", areaNm: "충북",   longitude: "127.4914", latitude: "36.6424" },
  { areaCode: "44", areaNm: "충남",   longitude: "127.1237", latitude: "36.5184" },
  { areaCode: "45", areaNm: "전북",   longitude: "127.1450", latitude: "35.8214" },
  { areaCode: "46", areaNm: "전남",   longitude: "126.4629", latitude: "34.8160" },
  { areaCode: "47", areaNm: "경북",   longitude: "128.6050", latitude: "36.0190" },
  { areaCode: "48", areaNm: "경남",   longitude: "128.6853", latitude: "35.2383" },
  { areaCode: "50", areaNm: "제주",   longitude: "126.5312", latitude: "33.4996" },
];

function toYmd(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function resolveDateRange() {
  const [, , argStart, argEnd] = process.argv;
  if (argStart && argEnd) return { startYmd: argStart, endYmd: argEnd };
  if (argStart) return { startYmd: argStart, endYmd: argStart };

  // 기본값: 오늘 ~ 30일 후
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + 30);
  return { startYmd: toYmd(today), endYmd: toYmd(future) };
}

function dateRange(startYmd, endYmd) {
  const dates = [];
  const cur = new Date(`${startYmd.slice(0,4)}-${startYmd.slice(4,6)}-${startYmd.slice(6,8)}`);
  const end = new Date(`${endYmd.slice(0,4)}-${endYmd.slice(4,6)}-${endYmd.slice(6,8)}`);
  while (cur <= end) {
    dates.push(toYmd(new Date(cur)));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

async function fetchRiseSet(locdate, longitude, latitude, hubName) {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    locdate,
    longitude,
    latitude,
    hubName,
    _type: "json",
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const data = await res.json();
  const header = data?.response?.header;
  if (header?.resultCode !== "0000") {
    throw new Error(`API 오류 [${header?.resultCode}]: ${header?.resultMsg}`);
  }

  return data?.response?.body?.items?.item ?? null;
}

async function main() {
  const { startYmd, endYmd } = resolveDateRange();
  const dates = dateRange(startYmd, endYmd);
  console.log(`일출몰 정보 수집: ${startYmd} ~ ${endYmd} (${dates.length}일 × ${AREAS.length}개 지역)\n`);

  const rows = [];

  for (const area of AREAS) {
    process.stdout.write(`  ${area.areaNm} 수집 중...`);
    let success = 0;

    for (const locdate of dates) {
      try {
        await new Promise((r) => setTimeout(r, 100)); // rate limit
        const item = await fetchRiseSet(locdate, area.longitude, area.latitude, area.areaNm);
        if (!item) continue;

        rows.push({
          area_code:    area.areaCode,
          area_nm:      area.areaNm,
          locdate:      `${locdate.slice(0,4)}-${locdate.slice(4,6)}-${locdate.slice(6,8)}`,
          sunrise:      item.sunrise ?? null,
          sunset:       item.sunset  ?? null,
          moonrise:     item.moonrise ?? null,
          moonset:      item.moonset  ?? null,
          sun_altitude: item.sunAltitude ?? null,
          synced_at:    new Date().toISOString(),
        });
        success++;
      } catch (err) {
        console.warn(`\n    ⚠️  ${area.areaNm} ${locdate} 실패: ${err.message}`);
      }
    }

    console.log(` ${success}/${dates.length}일 완료`);
  }

  if (rows.length === 0) {
    console.log("\n수집된 데이터가 없습니다.");
    return;
  }

  console.log(`\nSupabase upsert 중... (${rows.length}건)`);
  const BATCH = 200;
  let total = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const { error, count } = await supabase
      .from("rise_set_info")
      .upsert(rows.slice(i, i + BATCH), { onConflict: "area_code,locdate", count: "exact" });
    if (error) throw error;
    total += count ?? 0;
  }

  console.log(`\n완료! ${total}건 upsert`);
}

main().catch((err) => {
  console.error("오류:", err.message);
  process.exit(1);
});
