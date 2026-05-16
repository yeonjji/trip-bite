// destination_intros 백필 — TourAPI detailIntro2 → destination_intros upsert
// 실행: node --env-file=.env.local scripts/sync-destination-intros.mjs
//
// resume: destination_intros에 없는 destination만 처리.
// throttle: row 사이 150ms.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOUR_API_KEY = process.env.PUBLIC_DATA_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !TOUR_API_KEY) {
  console.error("필수 환경변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const BATCH_SIZE = 100;
const ROW_SLEEP_MS = 150;

const COMMON_KEYS = new Set([
  "infocenter", "usetime", "restdate", "useseason", "parking",
  "accomcount", "chkpet", "chkbabycarriage", "chkcreditcard",
  "heritage1", "heritage2", "heritage3",
  "expguide", "expagerange",
]);

function splitFields(item) {
  const common = {};
  const extras = {};
  for (const [k, v] of Object.entries(item)) {
    if (k === "contentid" || k === "contenttypeid") continue;
    if (COMMON_KEYS.has(k)) common[k] = v;
    else extras[k] = v;
  }
  return { common, extras };
}

async function fetchDetailIntro(contentId, contentTypeId) {
  const params = new URLSearchParams({
    serviceKey: TOUR_API_KEY,
    MobileOS: "ETC",
    MobileApp: "TripBite",
    _type: "json",
    contentId,
    contentTypeId,
  });
  const res = await fetch(`${BASE_URL}/detailIntro2?${params}`);
  if (!res.ok) throw new Error(`detailIntro2 HTTP ${res.status}`);
  const data = await res.json();
  const header = data?.response?.header;
  if (header?.resultCode !== "0000") {
    throw new Error(`detailIntro2 API [${header?.resultCode}] ${header?.resultMsg}`);
  }
  const items = data?.response?.body?.items;
  if (items === "" || !items?.item?.length) return null;
  return items.item[0];
}

async function processRow({ content_id, content_type_id }) {
  const item = await fetchDetailIntro(content_id, content_type_id);
  const { common, extras } = item ? splitFields(item) : { common: {}, extras: {} };

  const { error } = await supabase
    .from("destination_intros")
    .upsert(
      {
        content_id,
        content_type_id,
        common_fields: common,
        extras,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "content_id" },
    );

  if (error) throw error;
}

async function fetchPendingBatch(excludeIds) {
  // destinations LEFT JOIN destination_intros — intros가 null인 row만
  let query = supabase
    .from("destinations")
    .select("content_id, content_type_id, destination_intros(content_id)")
    .is("destination_intros.content_id", null)
    .order("content_id")
    .range(0, BATCH_SIZE - 1);
  if (excludeIds.length > 0) {
    query = query.not(
      "content_id",
      "in",
      `(${excludeIds.map((id) => `"${id}"`).join(",")})`,
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  // destination_intros가 null인 row만 필터링 (left join 결과)
  return (data ?? []).filter((r) => r.destination_intros == null);
}

async function main() {
  console.log("🗺️  destination_intros 동기화 시작...\n");
  let totalProcessed = 0;
  let totalErrors = 0;
  const failedIds = new Set();

  while (true) {
    const batch = await fetchPendingBatch([...failedIds]);
    if (batch.length === 0) break;

    let progressedThisBatch = 0;
    for (const row of batch) {
      try {
        await processRow(row);
        totalProcessed++;
        progressedThisBatch++;
        if (totalProcessed % 50 === 0) {
          console.log(`  진행: ${totalProcessed}건`);
        }
      } catch (err) {
        totalErrors++;
        failedIds.add(row.content_id);
        console.error(`  ❌ ${row.content_id}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, ROW_SLEEP_MS));
    }

    if (progressedThisBatch === 0) {
      console.warn(`  ⚠️  연속 실패로 중단 (failed ${failedIds.size}건).`);
      break;
    }
  }

  console.log(
    `\n🎉 완료! 처리 ${totalProcessed}건 / 실패 ${totalErrors}건 / 스킵 ${failedIds.size}건`,
  );
  if (totalErrors > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
