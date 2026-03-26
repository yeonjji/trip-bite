// 농사로 지역특산물 향토음식 데이터 수집 스크립트
// 실행: node --env-file=.env.local scripts/sync-nongsaro-local.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NONGSARO_API_KEY = process.env.NONGSARO_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !NONGSARO_API_KEY) {
  console.error("필수 환경변수가 없습니다. (NONGSARO_API_KEY, SUPABASE_URL, SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE_URL = "https://api.nongsaro.go.kr/service/localFood";
const IMG_BASE = "https://www.nongsaro.go.kr";

// XML 태그 값 추출 헬퍼
function getTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim() : null;
}

// <item>...</item> 블록 배열 추출
function getItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) items.push(m[1]);
  return items;
}

function buildImageUrl(path, name) {
  // imgFilePath + imgFileNm 조합 또는 단독 경로
  const combined = path && name ? `${path}/${name}` : (path ?? name ?? "");
  if (!combined.trim()) return null;
  if (combined.startsWith("http")) return combined;
  return IMG_BASE + (combined.startsWith("/") ? combined : "/" + combined);
}

async function fetchList(pageNo = 1, numOfRows = 100) {
  const url = `${BASE_URL}/localFoodList?apiKey=${NONGSARO_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchDetail(cntntsNo) {
  const url = `${BASE_URL}/localFoodDtl?apiKey=${NONGSARO_API_KEY}&cntntsNo=${cntntsNo}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} (cntntsNo=${cntntsNo})`);
  return res.text();
}

function parseListItem(itemXml) {
  return {
    cntnts_no: getTag(itemXml, "cntntsNo"),
    food_name: getTag(itemXml, "foodNm") ?? "",
    sido_name: getTag(itemXml, "sidoNm"),
    sigun_name: getTag(itemXml, "sigunNm"),
    summary: getTag(itemXml, "foodSumry"),
    image_url: buildImageUrl(
      getTag(itemXml, "imgFilePath"),
      getTag(itemXml, "imgFileNm")
    ),
  };
}

function parseDetail(xml, base) {
  const item = getItems(xml)[0] ?? "";
  const src = item || xml;
  return {
    ...base,
    // 상세에서 더 풍부한 정보 덮어쓰기
    summary: getTag(src, "foodSumry") ?? base.summary,
    description: getTag(src, "foodDtl"),
    image_url:
      buildImageUrl(getTag(src, "imgFilePath"), getTag(src, "imgFileNm")) ??
      base.image_url,
    ingredients: getTag(src, "ingrdCn"),
    recipe: getTag(src, "rcipeCn"),
  };
}

async function main() {
  console.log("🌾 농사로 지역특산물 향토음식 수집 시작...\n");

  // 1페이지로 총 건수 파악
  console.log("  총 건수 파악 중...");
  const firstXml = await fetchList(1, 1);
  const totalCount = parseInt(getTag(firstXml, "totalCount") ?? "0", 10);
  const numOfRows = 100;
  const totalPages = Math.ceil(totalCount / numOfRows);
  console.log(`  총 ${totalCount}건, ${totalPages}페이지\n`);

  // 전체 목록 수집
  const listItems = [];
  for (let page = 1; page <= totalPages; page++) {
    process.stdout.write(`  목록 ${page}/${totalPages} 페이지...`);
    const xml = await fetchList(page, numOfRows);
    const items = getItems(xml);
    items.forEach((itemXml) => {
      const row = parseListItem(itemXml);
      if (row.cntnts_no) listItems.push(row);
    });
    console.log(` ${items.length}건`);
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n목록 ${listItems.length}건 수집 완료 → 상세 조회 시작...\n`);

  // 상세 조회 후 병합
  const allRows = [];
  for (let i = 0; i < listItems.length; i++) {
    const base = listItems[i];
    process.stdout.write(`  [${i + 1}/${listItems.length}] ${base.food_name}...`);
    try {
      const dtlXml = await fetchDetail(base.cntnts_no);
      const row = parseDetail(dtlXml, base);
      allRows.push(row);
      console.log(" ✓");
    } catch (e) {
      console.warn(` ⚠️  상세 실패: ${e.message}`);
      allRows.push(base);
    }
    await new Promise((r) => setTimeout(r, 80));
  }

  console.log(`\n총 ${allRows.length}건 수집 완료 → Supabase upsert 중...`);

  const BATCH = 100;
  let upserted = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("nongsaro_local_foods")
      .upsert(batch, { onConflict: "cntnts_no" });
    if (error) throw new Error(`upsert 오류: ${error.message}`);
    upserted += batch.length;
    console.log(`  ✅ ${upserted}/${allRows.length}건`);
  }

  console.log(`\n🎉 완료! 총 ${upserted}건 upsert`);
}

main().catch((err) => {
  console.error("❌ 오류:", err.message);
  process.exit(1);
});
