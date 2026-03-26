// 농사로 향토음식 데이터 수집 스크립트 (nvpcFdCkry)
// 실행: node --env-file=.env.local scripts/sync-nongsaro-hyangtofood.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NONGSARO_API_KEY = process.env.NONGSARO_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !NONGSARO_API_KEY) {
  console.error("필수 환경변수가 없습니다. (NONGSARO_API_KEY, SUPABASE_URL, SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE_URL = "https://api.nongsaro.go.kr/service/nvpcFdCkry";
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

function buildImageUrl(raw) {
  if (!raw || raw.trim() === "") return null;
  const v = raw.trim();
  if (v.startsWith("http")) return v;
  return IMG_BASE + (v.startsWith("/") ? v : "/" + v);
}

async function fetchList(pageNo = 1, numOfRows = 100) {
  const url = `${BASE_URL}/fdNmLst?apiKey=${NONGSARO_API_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&schType=B`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchDetail(cntntsNo) {
  const url = `${BASE_URL}/fdDtl?apiKey=${NONGSARO_API_KEY}&cntntsNo=${cntntsNo}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} (cntntsNo=${cntntsNo})`);
  return res.text();
}

function parseListItem(itemXml) {
  return {
    cntnts_no: getTag(itemXml, "cntntsNo"),
    food_name: getTag(itemXml, "fdNm") ?? "",
    sido_name: getTag(itemXml, "sidoNm"),
    food_type: getTag(itemXml, "food_type_ctg01") ?? getTag(itemXml, "foodTypCtg01"),
    image_url: buildImageUrl(
      getTag(itemXml, "rtnFileUrl") ?? getTag(itemXml, "imgFileNm")
    ),
  };
}

function parseDetail(xml, base) {
  const item = getItems(xml)[0] ?? "";
  const src = item || xml;
  return {
    ...base,
    food_name: getTag(src, "fdNm") ?? base.food_name,
    sido_name: getTag(src, "sidoNm") ?? base.sido_name,
    summary: getTag(src, "fdSumry") ?? getTag(src, "foodSumry"),
    description: getTag(src, "fdDtl") ?? getTag(src, "foodDtl"),
    image_url:
      buildImageUrl(getTag(src, "rtnFileUrl") ?? getTag(src, "imgFileNm")) ??
      base.image_url,
    ingredients: getTag(src, "ingrdCn"),
    recipe: getTag(src, "rcipeCn") ?? getTag(src, "ckryMth"),
    food_type:
      getTag(src, "food_type_ctg01") ??
      getTag(src, "foodTypCtg01") ??
      base.food_type,
    cooking_method:
      getTag(src, "ck_ry_ctg01") ?? getTag(src, "ckryCtg01"),
  };
}

async function main() {
  console.log("🌾 농사로 향토음식 수집 시작 (nvpcFdCkry)...\n");

  // 1페이지로 총 건수 파악
  console.log("  총 건수 파악 중...");
  const firstXml = await fetchList(1, 1);
  const totalCount = parseInt(getTag(firstXml, "totalCount") ?? "0", 10);
  const numOfRows = 100;
  const totalPages = Math.ceil(totalCount / numOfRows);
  console.log(`  총 ${totalCount}건, ${totalPages}페이지\n`);

  if (totalCount === 0) {
    console.warn("  ⚠️  데이터가 없습니다. 엔드포인트 또는 API 키를 확인하세요.");
    process.exit(0);
  }

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
      .from("nongsaro_hyangtofood")
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
