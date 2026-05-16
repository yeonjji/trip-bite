// destination_images 백필 — TourAPI detailImage2 → destination_images delete-then-insert
// 실행: node --env-file=.env.local scripts/sync-destination-images.mjs
//
// resume: destination_intros.synced_at 기준 (intros 적재됐는데 images 아직인 row).
//         단순화를 위해 left join destination_images using (content_id).
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

async function processRow({ content_id }) {
  const images = await fetchDetailImage(content_id);

  // 기존 row 삭제 후 신규 insert
  const { error: delErr } = await supabase
    .from("destination_images")
    .delete()
    .eq("content_id", content_id);
  if (delErr) throw delErr;

  if (images.length === 0) {
    // 빈 응답이면 "처리 완료" 마커가 없으므로 다음 실행 시 또 시도됨.
    // 명시적 sentinel row가 필요한 경우 별도 컬럼 추가 (현재는 단순화).
    return { inserted: 0 };
  }

  const rows = images.map((img, i) => ({
    content_id,
    origin_url: img.originimgurl ?? img.smallimageurl ?? "",
    image_name: img.imgname ?? null,
    serial_num: typeof img.serialnum === "string" ? parseInt(img.serialnum, 10) : (img.serialnum ?? i),
  })).filter((r) => r.origin_url);

  if (rows.length === 0) return { inserted: 0 };

  const { error: insErr } = await supabase.from("destination_images").insert(rows);
  if (insErr) throw insErr;
  return { inserted: rows.length };
}

async function fetchPendingBatch(excludeIds) {
  // destination_images에 row 0인 destinations만 처리
  // destinations LEFT JOIN destination_images using (content_id) WHERE images is null
  let query = supabase
    .from("destinations")
    .select("content_id, destination_images(content_id)")
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
  return (data ?? []).filter((r) => !r.destination_images || r.destination_images.length === 0);
}

async function main() {
  console.log("🖼  destination_images 동기화 시작...\n");
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  const failedIds = new Set();

  while (true) {
    const batch = await fetchPendingBatch([...failedIds]);
    if (batch.length === 0) break;

    let progressedThisBatch = 0;
    for (const row of batch) {
      try {
        const { inserted } = await processRow(row);
        totalProcessed++;
        totalInserted += inserted;
        progressedThisBatch++;
        if (totalProcessed % 50 === 0) {
          console.log(`  진행: ${totalProcessed}건 (이미지 ${totalInserted}장)`);
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
    `\n🎉 완료! 처리 ${totalProcessed}건 / 이미지 ${totalInserted}장 / 실패 ${totalErrors}건`,
  );
  if (totalErrors > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
