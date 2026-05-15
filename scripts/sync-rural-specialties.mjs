// 농촌진흥청 지역특산물 동기화 스크립트 (localSpcprd)
// 실행: node --env-file=.env.local scripts/sync-rural-specialties.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RURAL_API_KEY = process.env.RURAL_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RURAL_API_KEY) {
  console.error("필수 환경변수가 없습니다. (RURAL_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE = "http://api.nongsaro.go.kr/service/localSpcprd";

// XML CDATA 값 추출
function getVal(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

// XML item 블록 배열 추출
function getItems(xml) {
  const re = /<item>([\s\S]*?)<\/item>/g;
  const items = [];
  let m;
  while ((m = re.exec(xml)) !== null) items.push(m[1]);
  return items;
}

async function fetchList(pageNo, numOfRows = 1000) {
  const url = `${BASE}/localSpcprdLst?apiKey=${RURAL_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const resultCode = getVal(text, "resultCode");
  if (resultCode !== "00") throw new Error(`API 오류 [${resultCode}]: ${getVal(text, "resultMsg")}`);
  const items = getItems(text);
  const totalCount = parseInt(getVal(text, "totalCount"), 10) || 0;
  return { items, totalCount };
}

// areaNm 파싱: "경상북도 > 영양군" → {sido: "경상북도", sigungu: "영양군"}
function parseAreaNm(areaNm) {
  if (!areaNm) return { sido: "", sigungu: "" };
  const parts = areaNm.split(">").map((s) => s.trim());
  return {
    sido: parts[0] || "",
    sigungu: parts[1] || "",
  };
}

// nongsaro 전체 시도명 → DB 약칭 매핑
const SIDO_NAME_MAP = {
  "서울특별시": "서울", "서울": "서울",
  "부산광역시": "부산", "부산": "부산",
  "대구광역시": "대구", "대구": "대구",
  "인천광역시": "인천", "인천": "인천",
  "광주광역시": "광주", "광주": "광주",
  "대전광역시": "대전", "대전": "대전",
  "울산광역시": "울산", "울산": "울산",
  "세종특별자치시": "세종", "세종": "세종",
  "경기도": "경기", "경기": "경기",
  "강원도": "강원", "강원특별자치도": "강원", "강원": "강원",
  "충청북도": "충북", "충북": "충북",
  "충청남도": "충남", "충남": "충남",
  "전라북도": "전북", "전북특별자치도": "전북", "전북": "전북",
  "전라남도": "전남", "전남": "전남",
  "경상북도": "경북", "경북": "경북",
  "경상남도": "경남", "경남": "경남",
  "제주특별자치도": "제주", "제주": "제주",
};

// 시도 이름으로 region_id 찾기
function findRegionId(regionMap, areaNm) {
  const { sido } = parseAreaNm(areaNm);

  // 매핑 테이블로 DB 약칭 변환 후 조회
  const dbName = SIDO_NAME_MAP[sido];
  if (dbName && regionMap.has(dbName)) return regionMap.get(dbName);

  // 직접 매칭 (이미 약칭인 경우)
  if (regionMap.has(sido)) return regionMap.get(sido);

  return null;
}

async function main() {
  console.log("🌾 지역특산물 데이터 동기화 시작 (localSpcprd)...\n");

  // 시도 레벨 regions 로드 (area_code 2자리)
  const { data: allRegions, error: regErr } = await supabase
    .from("regions")
    .select("id, area_code, name_ko");

  if (regErr) throw new Error(`regions 로드 실패: ${regErr.message}`);

  // 시도 레벨만 필터 (area_code 2자리)
  const sidoRegions = allRegions.filter((r) => r.area_code && r.area_code.length === 2);
  const regionMap = new Map(sidoRegions.map((r) => [r.name_ko, r.id]));
  console.log(`지역 로드: ${sidoRegions.length}개 시도`);

  // 전체 건수 파악
  const first = await fetchList(1, 1);
  const totalCount = first.totalCount;
  console.log(`총 지역특산물 수: ${totalCount}건`);

  const PAGE_SIZE = 1000;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  let processed = 0;
  let skipped = 0;

  for (let page = 1; page <= totalPages; page++) {
    const { items } = await fetchList(page, PAGE_SIZE);
    const rows = [];

    for (const itemXml of items) {
      const cntntsNo = getVal(itemXml, "cntntsNo");
      const cntntsSj = getVal(itemXml, "cntntsSj");
      const areaNm = getVal(itemXml, "areaNm");
      const imgUrl = getVal(itemXml, "imgUrl");

      if (!cntntsNo || !cntntsSj) continue;

      const regionId = findRegionId(regionMap, areaNm);
      if (!regionId) {
        console.warn(`  ⚠️  지역 매칭 실패: "${areaNm}" (${cntntsSj})`);
        skipped++;
        continue;
      }

      rows.push({
        name_ko: cntntsSj,
        region_id: regionId,
        category: "농산물",
        season: [],
        image_url: imgUrl || null,
        source: "nongsaro",
        external_id: cntntsNo,
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from("specialties")
        .upsert(rows, { onConflict: "external_id" });
      if (error) {
        console.error(`  ❌ 페이지 ${page} upsert 오류:`, error.message);
      } else {
        processed += rows.length;
        console.log(`  ✅ 페이지 ${page}/${totalPages}: ${processed}건 완료`);
      }
    }
  }

  console.log(`\n🎉 완료! 성공: ${processed}건, 건너뜀: ${skipped}건`);
}

main().catch((err) => {
  console.error("❌ 오류:", err.message);
  process.exit(1);
});
