// 이미지 누락 데이터 재동기화 스크립트
// 실행: node --env-file=.env.local scripts/fix-missing-images.mjs [--table destinations|camping|pet|barrier-free|recipes|all] [--dry-run]

import { createClient } from "@supabase/supabase-js";

// ─── 환경변수 ───────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOUR_API_KEY = process.env.TOUR_API_KEY;
const PET_API_KEY = process.env.PET_TOUR_API_KEY ?? process.env.TOUR_API_KEY;
const CAMPING_API_KEY = process.env.CAMPING_API_KEY;
const RECIPE_API_KEY = process.env.RECIPE_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE 환경변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── CLI 인수 파싱 ──────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const tableIdx = args.indexOf("--table");
const targetTable = tableIdx !== -1 ? args[tableIdx + 1] : "all";

// ─── 공통 유틸 ──────────────────────────────────────────────
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await delay(1000);
    }
  }
}

// Supabase select는 기본 1000건 제한 → 페이지네이션으로 전체 조회
async function fetchAllMissing(table, idColumn, imageColumn) {
  const allRows = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(idColumn)
      .or(`${imageColumn}.is.null,${imageColumn}.eq.`)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allRows;
}

function extractApiItems(json) {
  const body = json?.response?.body;
  if (!body) return [];
  const raw = body.items;
  if (!raw || raw === "") return [];
  const items = raw.item;
  return Array.isArray(items) ? items : [items];
}

function tourParams(serviceKey, extra = {}) {
  const p = new URLSearchParams({
    serviceKey,
    MobileOS: "ETC",
    MobileApp: "TripBite",
    _type: "json",
    ...extra,
  });
  return p;
}

// ─── 1. destinations (KorService2) ─────────────────────────
async function fixDestinations() {
  if (!TOUR_API_KEY) {
    console.log("⚠️  TOUR_API_KEY 없음 → destinations 건너뜀");
    return { total: 0, fixed: 0, stillMissing: 0 };
  }

  const BASE = "https://apis.data.go.kr/B551011/KorService2";

  const rows = await fetchAllMissing("destinations", "content_id", "first_image");
  const total = rows.length;
  console.log(`\n📍 destinations: 이미지 누락 ${total}건`);
  if (dryRun || total === 0) return { total, fixed: 0, stillMissing: total };

  let fixed = 0;

  for (let i = 0; i < rows.length; i++) {
    const { content_id } = rows[i];
    try {
      // 1차: detailCommon2
      const params1 = tourParams(TOUR_API_KEY, { contentId: content_id, firstImageYN: "Y", defaultYN: "Y" });
      const json1 = await fetchJson(`${BASE}/detailCommon2?${params1}`);
      const items1 = extractApiItems(json1);
      let firstImage = items1[0]?.firstimage || null;
      let firstImage2 = items1[0]?.firstimage2 || null;

      // 2차: detailImage2 (fallback)
      if (!firstImage) {
        const params2 = tourParams(TOUR_API_KEY, { contentId: content_id, imageYN: "Y", subImageYN: "Y" });
        const json2 = await fetchJson(`${BASE}/detailImage2?${params2}`);
        const items2 = extractApiItems(json2);
        if (items2.length > 0) {
          firstImage = items2[0].originimgurl || null;
          if (!firstImage2 && items2.length > 1) {
            firstImage2 = items2[1].originimgurl || null;
          }
        }
      }

      if (firstImage) {
        const update = { first_image: firstImage };
        if (firstImage2) update.first_image2 = firstImage2;
        await supabase.from("destinations").update(update).eq("content_id", content_id);
        fixed++;
      }
    } catch (err) {
      console.error(`  ⚠️ ${content_id}: ${err.message}`);
    }

    if ((i + 1) % 50 === 0) process.stdout.write(`\r  진행: ${i + 1}/${total} (수정 ${fixed}건)`);
    await delay();
  }

  const stillMissing = total - fixed;
  console.log(`\r  ✅ destinations: ${fixed}건 수정, ${stillMissing}건 여전히 누락`);
  return { total, fixed, stillMissing };
}

// ─── 2. camping_sites (GoCamping) ───────────────────────────
async function fixCamping() {
  if (!CAMPING_API_KEY) {
    console.log("⚠️  CAMPING_API_KEY 없음 → camping 건너뜀");
    return { total: 0, fixed: 0, stillMissing: 0 };
  }

  const BASE = "https://apis.data.go.kr/B551011/GoCamping";

  const rows = await fetchAllMissing("camping_sites", "content_id", "first_image_url");
  const total = rows.length;
  console.log(`\n🏕️  camping_sites: 이미지 누락 ${total}건`);
  if (dryRun || total === 0) return { total, fixed: 0, stillMissing: total };

  let fixed = 0;

  for (let i = 0; i < rows.length; i++) {
    const { content_id } = rows[i];
    try {
      const params = tourParams(CAMPING_API_KEY, { contentId: content_id });
      const json = await fetchJson(`${BASE}/imageList?${params}`);
      const items = extractApiItems(json);

      if (items.length > 0 && items[0].imageUrl) {
        await supabase
          .from("camping_sites")
          .update({ first_image_url: items[0].imageUrl })
          .eq("content_id", content_id);
        fixed++;
      }
    } catch (err) {
      console.error(`  ⚠️ ${content_id}: ${err.message}`);
    }

    if ((i + 1) % 50 === 0) process.stdout.write(`\r  진행: ${i + 1}/${total} (수정 ${fixed}건)`);
    await delay();
  }

  const stillMissing = total - fixed;
  console.log(`\r  ✅ camping_sites: ${fixed}건 수정, ${stillMissing}건 여전히 누락`);
  return { total, fixed, stillMissing };
}

// ─── 3. pet_friendly_places (KorPetTourService2) ────────────
async function fixPetPlaces() {
  if (!PET_API_KEY) {
    console.log("⚠️  PET_TOUR_API_KEY / TOUR_API_KEY 없음 → pet 건너뜀");
    return { total: 0, fixed: 0, stillMissing: 0 };
  }

  const BASE = "https://apis.data.go.kr/B551011/KorPetTourService2";

  const rows = await fetchAllMissing("pet_friendly_places", "content_id", "first_image");
  const total = rows.length;
  console.log(`\n🐾 pet_friendly_places: 이미지 누락 ${total}건`);
  if (dryRun || total === 0) return { total, fixed: 0, stillMissing: total };

  let fixed = 0;

  for (let i = 0; i < rows.length; i++) {
    const { content_id } = rows[i];
    try {
      // 1차: detailCommon2
      const params1 = tourParams(PET_API_KEY, { contentId: content_id, firstImageYN: "Y", defaultYN: "Y" });
      const json1 = await fetchJson(`${BASE}/detailCommon2?${params1}`);
      const items1 = extractApiItems(json1);
      let firstImage = items1[0]?.firstimage || null;
      let firstImage2 = items1[0]?.firstimage2 || null;

      // 2차: detailImage2 (fallback)
      if (!firstImage) {
        const params2 = tourParams(PET_API_KEY, { contentId: content_id, imageYN: "Y", subImageYN: "Y" });
        const json2 = await fetchJson(`${BASE}/detailImage2?${params2}`);
        const items2 = extractApiItems(json2);
        if (items2.length > 0) {
          firstImage = items2[0].originimgurl || null;
          if (!firstImage2 && items2.length > 1) {
            firstImage2 = items2[1].originimgurl || null;
          }
        }
      }

      if (firstImage) {
        const update = { first_image: firstImage };
        if (firstImage2) update.first_image2 = firstImage2;
        await supabase.from("pet_friendly_places").update(update).eq("content_id", content_id);
        fixed++;
      }
    } catch (err) {
      console.error(`  ⚠️ ${content_id}: ${err.message}`);
    }

    if ((i + 1) % 50 === 0) process.stdout.write(`\r  진행: ${i + 1}/${total} (수정 ${fixed}건)`);
    await delay();
  }

  const stillMissing = total - fixed;
  console.log(`\r  ✅ pet_friendly_places: ${fixed}건 수정, ${stillMissing}건 여전히 누락`);
  return { total, fixed, stillMissing };
}

// ─── 4. barrier_free_places (KorWithService2) ───────────────
async function fixBarrierFree() {
  if (!TOUR_API_KEY) {
    console.log("⚠️  TOUR_API_KEY 없음 → barrier-free 건너뜀");
    return { total: 0, fixed: 0, stillMissing: 0 };
  }

  const BASE = "https://apis.data.go.kr/B551011/KorWithService2";

  const rows = await fetchAllMissing("barrier_free_places", "content_id", "first_image");
  const total = rows.length;
  console.log(`\n♿ barrier_free_places: 이미지 누락 ${total}건`);
  if (dryRun || total === 0) return { total, fixed: 0, stillMissing: total };

  let fixed = 0;

  for (let i = 0; i < rows.length; i++) {
    const { content_id } = rows[i];
    try {
      // 1차: detailCommon2
      const params1 = tourParams(TOUR_API_KEY, { contentId: content_id, firstImageYN: "Y", defaultYN: "Y" });
      const json1 = await fetchJson(`${BASE}/detailCommon2?${params1}`);
      const items1 = extractApiItems(json1);
      let firstImage = items1[0]?.firstimage || null;
      let firstImage2 = items1[0]?.firstimage2 || null;

      // 2차: detailImage2 (fallback)
      if (!firstImage) {
        const params2 = tourParams(TOUR_API_KEY, { contentId: content_id, imageYN: "Y", subImageYN: "Y" });
        const json2 = await fetchJson(`${BASE}/detailImage2?${params2}`);
        const items2 = extractApiItems(json2);
        if (items2.length > 0) {
          firstImage = items2[0].originimgurl || null;
          if (!firstImage2 && items2.length > 1) {
            firstImage2 = items2[1].originimgurl || null;
          }
        }
      }

      if (firstImage) {
        const update = { first_image: firstImage };
        if (firstImage2) update.first_image2 = firstImage2;
        await supabase.from("barrier_free_places").update(update).eq("content_id", content_id);
        fixed++;
      }
    } catch (err) {
      console.error(`  ⚠️ ${content_id}: ${err.message}`);
    }

    if ((i + 1) % 50 === 0) process.stdout.write(`\r  진행: ${i + 1}/${total} (수정 ${fixed}건)`);
    await delay();
  }

  const stillMissing = total - fixed;
  console.log(`\r  ✅ barrier_free_places: ${fixed}건 수정, ${stillMissing}건 여전히 누락`);
  return { total, fixed, stillMissing };
}

// ─── 5. recipes (COOKRCP01) ─────────────────────────────────
async function fixRecipes() {
  if (!RECIPE_API_KEY) {
    console.log("⚠️  RECIPE_API_KEY 없음 → recipes 건너뜀");
    return { total: 0, fixed: 0, stillMissing: 0 };
  }

  const BASE = `http://openapi.foodsafetykorea.go.kr/api/${RECIPE_API_KEY}/COOKRCP01/json`;

  const rows = await fetchAllMissing("recipes", "rcp_seq", "main_image_url");
  const total = rows.length;
  console.log(`\n🍳 recipes: 이미지 누락 ${total}건`);
  if (dryRun || total === 0) return { total, fixed: 0, stillMissing: total };

  // 전체 레시피 API에서 재fetch
  const missingSeqs = new Set(rows.map((r) => r.rcp_seq));
  let fixed = 0;

  // 첫 페이지로 totalCount 확인
  const firstJson = await fetchJson(`${BASE}/1/1000`);
  const apiTotal = parseInt(firstJson.COOKRCP01.total_count, 10) || 0;
  const allApiItems = [...(firstJson.COOKRCP01.row ?? [])];

  let pageStart = 1001;
  while (pageStart <= apiTotal) {
    const endIdx = Math.min(pageStart + 999, apiTotal);
    const pageJson = await fetchJson(`${BASE}/${pageStart}/${endIdx}`);
    allApiItems.push(...(pageJson.COOKRCP01.row ?? []));
    pageStart += 1000;
  }

  console.log(`  API에서 ${allApiItems.length}건 재수집 완료`);

  const updates = [];
  for (const item of allApiItems) {
    const seq = item.RCP_SEQ;
    if (!missingSeqs.has(seq)) continue;

    const mainImg = item.ATT_FILE_NO_MAIN?.trim() || null;
    const finishedImg = item.ATT_FILE_NO_MK?.trim() || null;

    if (mainImg) {
      updates.push({ rcp_seq: seq, main_image_url: mainImg, finished_image_url: finishedImg });
    }
  }

  for (const upd of updates) {
    const updateData = { main_image_url: upd.main_image_url };
    if (upd.finished_image_url) updateData.finished_image_url = upd.finished_image_url;
    await supabase.from("recipes").update(updateData).eq("rcp_seq", upd.rcp_seq);
    fixed++;
  }

  const stillMissing = total - fixed;
  console.log(`  ✅ recipes: ${fixed}건 수정, ${stillMissing}건 여전히 누락`);
  return { total, fixed, stillMissing };
}

// ─── main ───────────────────────────────────────────────────
const handlers = {
  destinations: fixDestinations,
  camping: fixCamping,
  pet: fixPetPlaces,
  "barrier-free": fixBarrierFree,
  recipes: fixRecipes,
};

async function main() {
  console.log(`🔧 이미지 누락 보충 스크립트${dryRun ? " (DRY RUN)" : ""}`);
  console.log(`   대상: ${targetTable}\n`);

  const tablesToRun = targetTable === "all" ? Object.keys(handlers) : [targetTable];
  const results = {};

  for (const table of tablesToRun) {
    const handler = handlers[table];
    if (!handler) {
      console.error(`❌ 알 수 없는 테이블: ${table}`);
      console.log(`   사용 가능: ${Object.keys(handlers).join(", ")}, all`);
      process.exit(1);
    }
    results[table] = await handler();
  }

  // 결과 요약
  console.log("\n" + "═".repeat(50));
  console.log("📊 결과 요약");
  console.log("═".repeat(50));
  console.log(
    `${"테이블".padEnd(24)} ${"누락".padStart(6)} ${"수정".padStart(6)} ${"잔여".padStart(6)}`
  );
  console.log("─".repeat(50));

  let grandTotal = 0, grandFixed = 0, grandMissing = 0;
  for (const [table, r] of Object.entries(results)) {
    console.log(
      `${table.padEnd(24)} ${String(r.total).padStart(6)} ${String(r.fixed).padStart(6)} ${String(r.stillMissing).padStart(6)}`
    );
    grandTotal += r.total;
    grandFixed += r.fixed;
    grandMissing += r.stillMissing;
  }

  console.log("─".repeat(50));
  console.log(
    `${"합계".padEnd(24)} ${String(grandTotal).padStart(6)} ${String(grandFixed).padStart(6)} ${String(grandMissing).padStart(6)}`
  );
  console.log("═".repeat(50));
}

main().catch((err) => {
  console.error("❌ 오류:", err);
  process.exit(1);
});
