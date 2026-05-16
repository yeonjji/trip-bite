// destinations 테이블의 intro_data / image_data 백필
// 실행: node --env-file=.env.local scripts/sync-destination-details.mjs
//
// resume: intro_data IS NULL인 row만 처리. 재실행 안전.
// throttle: row 사이 150ms sleep (TourAPI 일일 한도 보호).

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
const BATCH_SIZE = 1000;
const ROW_SLEEP_MS = 150;

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

async function fetchDetailImage(contentId) {
  const params = new URLSearchParams({
    serviceKey: TOUR_API_KEY,
    MobileOS: "ETC",
    MobileApp: "TripBite",
    _type: "json",
    contentId,
    imageYN: "Y",
  });
  const res = await fetch(`${BASE_URL}/detailImage2?${params}`);
  if (!res.ok) throw new Error(`detailImage2 HTTP ${res.status}`);
  const data = await res.json();
  const header = data?.response?.header;
  if (header?.resultCode !== "0000") {
    throw new Error(`detailImage2 API [${header?.resultCode}] ${header?.resultMsg}`);
  }
  const items = data?.response?.body?.items;
  if (items === "") return [];
  const arr = items?.item;
  return Array.isArray(arr) ? arr : (arr ? [arr] : []);
}

async function processRow({ content_id, content_type_id }) {
  const [intro, images] = await Promise.all([
    fetchDetailIntro(content_id, content_type_id),
    fetchDetailImage(content_id),
  ]);

  const update = {
    intro_data: intro ?? {},
    image_data: images,
  };

  const { error } = await supabase
    .from("destinations")
    .update(update)
    .eq("content_id", content_id);

  if (error) throw error;
}

async function fetchPendingBatch(excludeIds) {
  let query = supabase
    .from("destinations")
    .select("content_id, content_type_id")
    .is("intro_data", null)
    .order("content_id")
    .range(0, BATCH_SIZE - 1);
  if (excludeIds.length > 0) {
    // Supabase에서 .not.in()은 `(a,b,c)` 형식 문자열을 받음
    query = query.not("content_id", "in", `(${excludeIds.map((id) => `"${id}"`).join(",")})`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function main() {
  console.log("🗺️  destinations intro/image 백필 시작...\n");
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
          console.log(`  진행: ${totalProcessed}건 완료`);
        }
      } catch (err) {
        totalErrors++;
        failedIds.add(row.content_id);
        console.error(`  ❌ ${row.content_id}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, ROW_SLEEP_MS));
    }

    if (progressedThisBatch === 0) {
      console.warn(`  ⚠️  연속 실패로 중단 (failed ${failedIds.size}건). 재실행하면 NULL인 row를 다시 시도합니다.`);
      break;
    }
  }

  console.log(`\n🎉 완료! 처리 ${totalProcessed}건 / 실패 ${totalErrors}건 / 스킵 ${failedIds.size}건`);
}

main().catch(console.error);
