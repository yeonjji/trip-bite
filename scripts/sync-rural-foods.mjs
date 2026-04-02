// 농촌진흥청 향토음식 동기화 스크립트 (nvpcFdCkry)
// 실행: node --env-file=.env.local scripts/sync-rural-foods.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RURAL_API_KEY = process.env.RURAL_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RURAL_API_KEY) {
  console.error("필수 환경변수가 없습니다. (RURAL_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE = "http://api.nongsaro.go.kr/service/nvpcFdCkry";

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

// 조리법 텍스트 → steps 배열
function parseSteps(text) {
  if (!text || text.trim() === "") return [];
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((desc, i) => ({ step: i + 1, description: desc }));
}

// 음식 유형 → 카테고리 (첫 번째 > 앞 부분)
function parseCategory(fullname) {
  if (!fullname) return "";
  return fullname.split(">")[0].trim();
}

// 조리방법 → 마지막 > 뒤 부분
function parseCookingMethod(fullname) {
  if (!fullname) return "";
  const parts = fullname.split(">");
  return parts[parts.length - 1].trim();
}

// 이미지 URL 조합
function buildImageUrl(fileCours, thumbNm) {
  if (!fileCours || !thumbNm) return null;
  return `http://www.nongsaro.go.kr/${fileCours.replace(/^\//, "")}${thumbNm}`;
}

async function fetchList(pageNo, numOfRows = 100) {
  const url = `${BASE}/fdNmLst?apiKey=${RURAL_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const resultCode = getVal(text, "resultCode");
  if (resultCode !== "00") throw new Error(`API 오류 [${resultCode}]: ${getVal(text, "resultMsg")}`);
  const items = getItems(text);
  const totalCount = parseInt(getVal(text, "totalCount"), 10) || 0;
  return { items, totalCount };
}

async function fetchDetail(cntntsNo) {
  const url = `${BASE}/fdNmDtl?apiKey=${RURAL_API_KEY}&cntntsNo=${cntntsNo}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  if (getVal(text, "resultCode") !== "00") return null;
  return text;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("🌾 향토음식 데이터 동기화 시작 (nvpcFdCkry)...\n");

  // 전체 건수 파악
  const first = await fetchList(1, 1);
  const totalCount = first.totalCount;
  console.log(`총 향토음식 수: ${totalCount}건`);

  const PAGE_SIZE = 100;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  let processed = 0;
  let failed = 0;

  for (let page = 1; page <= totalPages; page++) {
    const { items } = await fetchList(page, PAGE_SIZE);
    const rows = [];

    for (const itemXml of items) {
      const cntntsNo = getVal(itemXml, "cntntsNo");
      if (!cntntsNo) continue;

      const trditfdNm = getVal(itemXml, "trditfdNm");
      const atptCodeNm = getVal(itemXml, "atptCodeNm");
      const foodTyCodeFullname = getVal(itemXml, "foodTyCodeFullname");
      const ckryCodeFullname = getVal(itemXml, "ckryCodeFullname");
      const rtnFileCours = getVal(itemXml, "rtnFileCours");
      const rtnThumbFileNm = getVal(itemXml, "rtnThumbFileNm");

      // 상세 정보 조회
      await delay(200);
      const detailXml = await fetchDetail(cntntsNo);
      let ingredients = null;
      let steps = [];

      if (detailXml) {
        ingredients = getVal(detailXml, "fdmtInfo") || null;
        const cookingText = getVal(detailXml, "stdCkryDtl");
        steps = parseSteps(cookingText);
      }

      rows.push({
        rcp_seq: `HA-${cntntsNo}`,
        rural_food_id: cntntsNo,
        source: "향토음식",
        name: trditfdNm,
        category: parseCategory(foodTyCodeFullname),
        cooking_method: parseCookingMethod(ckryCodeFullname),
        main_image_url: buildImageUrl(rtnFileCours, rtnThumbFileNm),
        ingredients,
        steps,
        nutrition: {},
        hash_tags: atptCodeNm ? [atptCodeNm] : [],
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from("recipes")
        .upsert(rows, { onConflict: "rural_food_id" });
      if (error) {
        console.error(`  ❌ 페이지 ${page} upsert 오류:`, error.message);
        failed += rows.length;
      } else {
        processed += rows.length;
        console.log(`  ✅ 페이지 ${page}/${totalPages}: ${processed}건 완료`);
      }
    }
  }

  console.log(`\n🎉 완료! 성공: ${processed}건, 실패: ${failed}건`);
}

main().catch((err) => {
  console.error("❌ 오류:", err.message);
  process.exit(1);
});
