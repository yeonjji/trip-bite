// 레시피 데이터 수집 스크립트 (COOKRCP01)
// 실행: node --env-file=.env.local scripts/sync-recipes.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RECIPE_API_KEY = process.env.RECIPE_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RECIPE_API_KEY) {
  console.error("필수 환경변수가 없습니다. (RECIPE_API_KEY, SUPABASE_URL, SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE_URL = `http://openapi.foodsafetykorea.go.kr/api/${RECIPE_API_KEY}/COOKRCP01/json`;

function parseNum(val) {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function buildSteps(item) {
  const steps = [];
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(2, "0");
    const desc = item[`MANUAL${pad}`];
    const img = item[`MANUAL_IMG${pad}`];
    if (desc && desc.trim() !== "") {
      steps.push({
        step: i,
        description: desc.trim(),
        imageUrl: img && img.trim() !== "" ? img.trim() : undefined,
      });
    }
  }
  return steps;
}

function buildHashTags(hashTag) {
  if (!hashTag || hashTag.trim() === "") return [];
  return hashTag.split("#").map((t) => t.trim()).filter((t) => t.length > 0);
}

function toRecipeRow(item) {
  return {
    rcp_seq: item.RCP_SEQ,
    name: item.RCP_NM,
    cooking_method: item.RCP_WAY2 ?? "",
    category: item.RCP_PAT2 ?? "",
    main_image_url: item.ATT_FILE_NO_MAIN?.trim() || null,
    finished_image_url: item.ATT_FILE_NO_MK?.trim() || null,
    ingredients: item.RCP_PARTS_DTLS?.trim() || null,
    steps: buildSteps(item),
    nutrition: {
      calories: parseNum(item.INFO_ENG),
      carbs: parseNum(item.INFO_CAR),
      protein: parseNum(item.INFO_PRO),
      fat: parseNum(item.INFO_FAT),
      sodium: parseNum(item.INFO_NA),
    },
    hash_tags: buildHashTags(item.HASH_TAG),
  };
}

async function fetchPage(startIdx, endIdx) {
  const url = `${BASE_URL}/${startIdx}/${endIdx}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const { CODE, MSG } = data.COOKRCP01.RESULT;
  if (CODE !== "INFO-000") throw new Error(`API 오류 [${CODE}]: ${MSG}`);
  return {
    items: data.COOKRCP01.row ?? [],
    totalCount: parseInt(data.COOKRCP01.total_count, 10) || 0,
  };
}

async function main() {
  console.log("🍳 레시피 데이터 수집 시작 (COOKRCP01)...\n");

  const firstPage = await fetchPage(1, 1000);
  const totalCount = firstPage.totalCount;
  console.log(`총 레시피 수: ${totalCount}건`);

  const allItems = [...firstPage.items];

  let pageStart = 1001;
  while (pageStart <= totalCount) {
    const endIdx = Math.min(pageStart + 999, totalCount);
    const page = await fetchPage(pageStart, endIdx);
    allItems.push(...page.items);
    pageStart += 1000;
  }

  console.log(`수집 완료: ${allItems.length}건 → Supabase upsert 중...`);

  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < allItems.length; i += BATCH) {
    const batch = allItems.slice(i, i + BATCH).map(toRecipeRow);
    const { error } = await supabase
      .from("recipes")
      .upsert(batch, { onConflict: "rcp_seq" });
    if (error) throw new Error(`upsert 오류: ${error.message}`);
    upserted += batch.length;
    console.log(`  ✅ ${upserted}/${allItems.length}건`);
  }

  console.log(`\n🎉 완료! 총 ${upserted}건 upsert`);
}

main().catch((err) => {
  console.error("❌ 오류:", err.message);
  process.exit(1);
});
