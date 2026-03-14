// node --env-file=.env.local scripts/sync-sigungu-codes.mjs
//
// 기능:
// 1. 17개 시도별로 법정동코드 API 호출
// 2. 시군구 레벨만 추출 (sgg_cd != '000' && umd_cd === '000')
// 3. 5자리 코드 = sido_cd + sgg_cd
// 4. regions 테이블에 upsert (area_code=5자리, parent_area_code=sido_cd)
// 5. destinations, pet_friendly_places, barrier_free_places의 sigungu_code UPDATE

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOUR_API_KEY = process.env.TOUR_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 필요");
  process.exit(1);
}

if (!TOUR_API_KEY) {
  console.error("TOUR_API_KEY 환경변수 필요 (data.go.kr 공통 키)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 시도코드 → 시도명 매핑 (법정동코드 API locatadd_nm 필터용)
const SIDO_LIST = [
  { code: "11", name: "서울특별시" },
  { code: "26", name: "부산광역시" },
  { code: "27", name: "대구광역시" },
  { code: "28", name: "인천광역시" },
  { code: "29", name: "광주광역시" },
  { code: "30", name: "대전광역시" },
  { code: "31", name: "울산광역시" },
  // 세종은 법정 시군구 구분 없는 단일 광역시 → 시도 레벨에서만 area_code='36110'으로 관리
  { code: "41", name: "경기도" },
  { code: "43", name: "충청북도" },
  { code: "44", name: "충청남도" },
  { code: "46", name: "전라남도" },
  { code: "47", name: "경상북도" },
  { code: "48", name: "경상남도" },
  { code: "50", name: "제주특별자치도" },
  { code: "51", name: "강원특별자치도" },
  { code: "52", name: "전라북도" },
];

// TourAPI 시도코드(1~17) → 법정동 sido_cd(2자리) 매핑
const TOUR_AREA_TO_SIDO = {
  "1": "11",  // 서울
  "2": "31",  // 인천 → 실제 인천=28, 강원=51, 정렬 순서는 TourAPI 기준
  "3": "28",  // 대전 → 실제 대전=30
  "4": "29",  // 대구 → 실제 대구=27
  "5": "26",  // 경기 → 실제 경기=41
  "6": "30",  // 부산 → 실제 부산=26
  "7": "27",  // 울산 → 실제 울산=31
  "8": "36",  // 세종
  "31": "41", // 경기도
  "32": "51", // 강원특별자치도
  "33": "43", // 충청북도
  "34": "44", // 충청남도
  "35": "29", // 광주광역시 → 실제 광주=29
  "36": "46", // 전라남도
  "37": "47", // 경상북도
  "38": "48", // 경상남도
  "39": "50", // 제주특별자치도
};

// TourAPI area_code → 법정동 sido_cd (destinations 테이블의 area_code 기준)
// destinations.area_code 는 KorService2 포맷 문자열
// 실제 매핑은 DB에서 regions 테이블을 통해 결정
// 여기서는 area_code(2자리 법정동 sido_cd) = parent_area_code로 직접 사용

async function fetchSigunguList(sidoCd) {
  const allItems = [];
  let pageNo = 1;
  const PAGE_SIZE = 1000;

  while (true) {
    const url = new URL("http://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList");
    url.searchParams.set("serviceKey", TOUR_API_KEY);
    url.searchParams.set("pageNo", String(pageNo));
    url.searchParams.set("numOfRows", String(PAGE_SIZE));
    url.searchParams.set("type", "json");
    url.searchParams.set("sido_cd", sidoCd);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`  법정동 API 오류 sido_cd=${sidoCd} page=${pageNo}: HTTP ${res.status}`);
      break;
    }

    const json = await res.json();
    const items = json?.StanReginCd?.[1]?.row ?? [];
    allItems.push(...items);

    const totalCount = json?.StanReginCd?.[0]?.head?.[0]?.totalCount ?? 0;
    if (pageNo * PAGE_SIZE >= totalCount) break;
    pageNo++;
    await new Promise((r) => setTimeout(r, 200));
  }

  return allItems.filter((item) => {
    if (item.sgg_cd === "000" || item.umd_cd !== "000") return false;
    // 시/군 레벨만 유지, 하위 구 제외 (예: "경기도 수원시" ✓, "경기도 수원시 장안구" ✗)
    const parts = item.locatadd_nm.trim().split(/\s+/);
    return parts.length === 2;
  });
}

async function run() {
  console.log("=== 법정동코드 시군구 동기화 시작 ===\n");

  // 기존 시군구 데이터 삭제 (parent_area_code IS NOT NULL 행)
  const { error: delErr } = await supabase
    .from("regions")
    .delete()
    .not("parent_area_code", "is", null);
  if (delErr) {
    console.error("시군구 삭제 실패:", delErr.message);
    process.exit(1);
  }
  console.log("기존 시군구 데이터 삭제 완료");

  const allSigungu = [];

  for (const sido of SIDO_LIST) {
    console.log(`[${sido.code}] ${sido.name} 시군구 조회 중...`);
    const items = await fetchSigunguList(sido.code);
    console.log(`  → ${items.length}개 시군구 발견`);

    for (const item of items) {
      const areaCode5 = item.sido_cd + item.sgg_cd; // 5자리
      // locatadd_nm 마지막 토큰 = 시군구명
      const parts = item.locatadd_nm.trim().split(/\s+/);
      const nameKo = parts[parts.length - 1];

      allSigungu.push({
        area_code: areaCode5,
        parent_area_code: sido.code,
        name_ko: nameKo,
        name_en: nameKo, // 영문명은 한국어로 대체 (추후 개선 가능)
      });
    }

    // API 과부하 방지
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n총 ${allSigungu.length}개 시군구 수집 완료`);

  // regions 테이블 upsert
  console.log("\nregions 테이블 upsert 중...");
  const { error: upsertErr } = await supabase
    .from("regions")
    .upsert(allSigungu, { onConflict: "area_code" });

  if (upsertErr) {
    console.error("regions upsert 실패:", upsertErr.message);
    process.exit(1);
  }
  console.log("regions upsert 완료");

  // destinations, pet_friendly_places, barrier_free_places의 sigungu_code 업데이트
  // DB의 area_code(시도) 기준으로 regions에서 시군구 목록을 가져와 매핑
  const TABLES = ["destinations", "pet_friendly_places", "barrier_free_places"];

  for (const table of TABLES) {
    console.log(`\n[${table}] sigungu_code 업데이트 중...`);

    // 시도별로 조회하여 Supabase 1000행 제한 우회
    const uniquePairs = new Map();
    for (const sido of SIDO_LIST) {
      let offset = 0;
      const PAGE = 1000;
      while (true) {
        const { data: rows, error: fetchErr } = await supabase
          .from(table)
          .select("area_code, sigungu_code, addr1")
          .eq("area_code", sido.code)
          .not("sigungu_code", "is", null)
          .not("addr1", "is", null)
          .range(offset, offset + PAGE - 1);

        if (fetchErr) {
          console.warn(`  ${table}/${sido.code} 조회 실패:`, fetchErr.message);
          break;
        }
        if (!rows || rows.length === 0) break;

        for (const row of rows) {
          const key = `${row.area_code}:${row.sigungu_code}`;
          if (!uniquePairs.has(key)) {
            uniquePairs.set(key, { areaCode: row.area_code, tourSigungu: row.sigungu_code, addr1: row.addr1 });
          }
        }

        if (rows.length < PAGE) break;
        offset += PAGE;
      }
    }

    console.log(`  ${uniquePairs.size}개 고유 (area_code, sigungu_code) 조합`);

    let updateCount = 0;
    let skipCount = 0;
    for (const [, pair] of uniquePairs) {
      // 이미 올바른 5자리 법정동코드이고 regions에 존재하면 스킵
      if (pair.tourSigungu && pair.tourSigungu.length === 5) {
        const exists = allSigungu.some((s) => s.area_code === pair.tourSigungu);
        if (exists) { skipCount++; continue; }
      }

      if (!pair.addr1) continue;

      // addr1에서 시군구명 추출 (두번째 토큰)
      const addrParts = pair.addr1.trim().split(/\s+/);
      if (addrParts.length < 2) continue;
      const sigunguName = addrParts[1];

      // 해당 시도의 시군구 목록에서 이름 매칭
      // area_code가 이미 SIDO_LIST에 있는 법정동 코드면 직접 사용
      const isSidoCd = SIDO_LIST.some((s) => s.code === pair.areaCode);
      const sidoCd = isSidoCd ? pair.areaCode : (TOUR_AREA_TO_SIDO[pair.areaCode] || pair.areaCode);

      const matched = allSigungu.find(
        (s) => s.parent_area_code === sidoCd && s.name_ko === sigunguName
      );

      if (!matched) {
        console.warn(`  매칭 실패: area=${pair.areaCode} sido=${sidoCd} sgg=${pair.tourSigungu} name=${sigunguName}`);
        continue;
      }

      if (matched.area_code === pair.tourSigungu) { skipCount++; continue; }

      // UPDATE
      const { error: updateErr } = await supabase
        .from(table)
        .update({ sigungu_code: matched.area_code })
        .eq("area_code", pair.areaCode)
        .eq("sigungu_code", pair.tourSigungu);

      if (updateErr) {
        console.warn(`  UPDATE 실패 (${pair.areaCode}/${pair.tourSigungu}):`, updateErr.message);
      } else {
        updateCount++;
      }
    }

    console.log(`  ${updateCount}개 업데이트, ${skipCount}개 스킵 (이미 정상)`);
  }

  console.log("\n=== 동기화 완료 ===");
}

run().catch((err) => {
  console.error("스크립트 오류:", err);
  process.exit(1);
});
