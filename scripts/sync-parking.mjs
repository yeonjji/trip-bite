/**
 * 전국주차장정보표준데이터 동기화 스크립트
 *
 * 실행: node --env-file=.env.local scripts/sync-parking.mjs
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
const BASE_URL = "https://api.data.go.kr/openapi/tn_pubr_prkplce_info_api";

const SIDO_TO_AREA_CODE = {
  "서울특별시": "11",
  "부산광역시": "26",
  "대구광역시": "27",
  "인천광역시": "28",
  "광주광역시": "29",
  "대전광역시": "30",
  "울산광역시": "31",
  "세종특별자치시": "36110",
  "경기도": "41",
  "강원도": "51",
  "강원특별자치도": "51",
  "충청북도": "43",
  "충청남도": "44",
  "전라북도": "52",
  "전북특별자치도": "52",
  "전라남도": "46",
  "경상북도": "47",
  "경상남도": "48",
  "제주특별자치도": "50",
};

async function fetchPage(pageNo, numOfRows = 1000, retries = 3) {
  const url = `${BASE_URL}?serviceKey=${API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=json`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  ⚠️  페이지 ${pageNo} 재시도 ${attempt}/${retries - 1}...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function main() {
  console.log("🅿️  주차장 데이터 동기화 시작...");

  const first = await fetchPage(1, 1);
  const total = parseInt(first.response?.body?.totalCount ?? "0");
  console.log(`📊 총 ${total.toLocaleString()}개`);

  const numOfRows = 1000;
  const pages = Math.ceil(total / numOfRows);
  let synced = 0;
  let errors = 0;

  for (let page = 1; page <= pages; page++) {
    const data = await fetchPage(page, numOfRows);
    const items = data.response?.body?.items ?? [];
    const rows = items.map((lot) => {
      // lnmadr 예: "충청남도 홍성군 홍성읍 오관리180" → sido/sigungu 추출
      const addrParts = (lot.lnmadr || "").split(" ");
      const sidoName = addrParts[0] || null;
      const sigunguName = addrParts[1] || null;

      return {
        manage_no:     lot.prkplceNo,
        name:          lot.prkplceNm ?? "",
        type:          lot.prkplceType || null,
        address_jibun: lot.lnmadr || null,
        address_road:  lot.rdnmadr || null,
        lat:           lot.latitude ? parseFloat(lot.latitude) : null,
        lng:           lot.longitude ? parseFloat(lot.longitude) : null,
        capacity:      lot.prkcmprt ? parseInt(lot.prkcmprt) : null,
        fee_type:      lot.parkingchrgeInfo || null,
        base_fee:      lot.basicCharge && lot.basicCharge !== "0" ? parseInt(lot.basicCharge) : null,
        weekday_open:  lot.weekdayOperOpenHhmm || null,
        weekday_close: lot.weekdayOperColseHhmm || null,
        sat_open:      lot.satOperOperOpenHhmm || null,
        sat_close:     lot.satOperCloseHhmm || null,
        holiday_open:  lot.holidayOperOpenHhmm || null,
        holiday_close: lot.holidayCloseOpenHhmm || null,
        disabled_spots: null,
        phone:         lot.phoneNumber || null,
        sido_name:     sidoName,
        sigungu_name:  sigunguName,
        area_code:     SIDO_TO_AREA_CODE[sidoName] ?? null,
      };
    });

    // 같은 배치 내 manage_no 중복 제거
    const deduped = Array.from(
      new Map(rows.map((r) => [r.manage_no, r])).values()
    );

    if (deduped.length > 0) {
      const { error } = await supabase
        .from("parking_lots")
        .upsert(deduped, { onConflict: "manage_no" });
      if (error) {
        console.error(`❌ 페이지 ${page} 오류:`, error.message);
        errors++;
      } else {
        synced += deduped.length;
      }
    }

    if (page % 10 === 0) {
      console.log(`  진행: ${page}/${pages} (${synced.toLocaleString()}개 완료)`);
    }
  }

  console.log(`✅ 완료: ${synced.toLocaleString()}개 동기화, 오류: ${errors}`);
}

main().catch(console.error);
