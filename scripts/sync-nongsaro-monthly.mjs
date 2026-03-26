// 농사로 이달의 음식 데이터 수집 스크립트
// 실행: node --env-file=.env.local scripts/sync-nongsaro-monthly.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NONGSARO_API_KEY = process.env.NONGSARO_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !NONGSARO_API_KEY) {
  console.error("필수 환경변수가 없습니다. (NONGSARO_API_KEY, SUPABASE_URL, SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE_URL = "https://api.nongsaro.go.kr/service/monthFd";
// 농사로 이미지 기본 경로 (상대경로일 경우 앞에 붙임)
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

async function fetchList(month, pageNo = 1, numOfRows = 100) {
  const url = `${BASE_URL}/monthFdList?apiKey=${NONGSARO_API_KEY}&sMonth=${month}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} (month=${month})`);
  return res.text();
}

async function fetchDetail(cntntsNo) {
  const url = `${BASE_URL}/monthFdDtl?apiKey=${NONGSARO_API_KEY}&cntntsNo=${cntntsNo}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} (cntntsNo=${cntntsNo})`);
  return res.text();
}

function parseListItem(itemXml, month) {
  return {
    cntnts_no: getTag(itemXml, "cntntsNo"),
    food_name: getTag(itemXml, "foodNm") ?? "",
    month: parseInt(month, 10),
    category: getTag(itemXml, "fldGroupNm"),
    thumbnail_url: buildImageUrl(getTag(itemXml, "thumbFileNm")),
  };
}

function parseDetail(xml, base) {
  // 상세 응답에서 추가 필드 추출
  const item = getItems(xml)[0] ?? "";
  return {
    ...base,
    summary: getTag(item, "foodSumry") ?? getTag(xml, "foodSumry"),
    description: getTag(item, "foodDtl") ?? getTag(xml, "foodDtl"),
    image_url: buildImageUrl(
      getTag(item, "imgFileNm") ?? getTag(xml, "imgFileNm")
    ),
    ingredients: getTag(item, "ingrdCn") ?? getTag(xml, "ingrdCn"),
    recipe: getTag(item, "rcipeCn") ?? getTag(xml, "rcipeCn"),
    nutrition: parseNutrition(item || xml),
  };
}

function parseNutrition(xml) {
  const fields = ["clriInfo", "carbohydrateInfo", "proteinInfo", "fatInfo", "naInfo"];
  const keys = ["calories", "carbs", "protein", "fat", "sodium"];
  const result = {};
  fields.forEach((f, i) => {
    const v = getTag(xml, f);
    if (v) {
      const n = parseFloat(v);
      if (!isNaN(n)) result[keys[i]] = n;
    }
  });
  return result;
}

async function main() {
  console.log("🌾 농사로 이달의 음식 수집 시작...\n");

  const allRows = [];

  for (let month = 1; month <= 12; month++) {
    process.stdout.write(`  월 ${month}월 목록 조회 중...`);
    let xml;
    try {
      xml = await fetchList(month);
    } catch (e) {
      console.error(` ❌ ${e.message}`);
      continue;
    }

    const returnCode = getTag(xml, "returnCode") ?? getTag(xml, "resultCode");
    if (returnCode && returnCode !== "00" && returnCode !== "0000") {
      console.log(` ⚠️  returnCode=${returnCode}, 건너뜀`);
      continue;
    }

    const totalCount = parseInt(getTag(xml, "totalCount") ?? "0", 10);
    const items = getItems(xml);
    console.log(` ${items.length}건 (총 ${totalCount}건)`);

    for (const itemXml of items) {
      const base = parseListItem(itemXml, month);
      if (!base.cntnts_no) continue;

      // 상세 조회
      try {
        const dtlXml = await fetchDetail(base.cntnts_no);
        const row = parseDetail(dtlXml, base);
        allRows.push(row);
      } catch (e) {
        console.warn(`    ⚠️  상세 조회 실패 (${base.cntnts_no}): ${e.message}`);
        allRows.push({ ...base, nutrition: {} });
      }

      // API 부하 방지
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  console.log(`\n총 ${allRows.length}건 수집 완료 → Supabase upsert 중...`);

  const BATCH = 100;
  let upserted = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("nongsaro_monthly_foods")
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
