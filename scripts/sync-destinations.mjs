// 여행지 데이터 수집 스크립트 (KorService2)
// 실행: node --env-file=.env.local scripts/sync-destinations.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOUR_API_KEY = process.env.PUBLIC_DATA_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !TOUR_API_KEY) {
  console.error("필수 환경변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// KorService2 지역 코드 (lDongRegnCd)
const AREA_CODES = ["11","26","27","28","29","30","31","41","43","44","46","47","48","50","51","52","36110"];

// 콘텐츠 타입 (관광지, 문화시설, 레포츠, 음식점)
const CONTENT_TYPES = ["12", "14", "28", "39"];

const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

async function fetchAreaBasedList(lDongRegnCd, contentTypeId, pageNo = 1) {
  const params = new URLSearchParams({
    serviceKey: TOUR_API_KEY,
    MobileOS: "ETC",
    MobileApp: "TripBite",
    _type: "json",
    numOfRows: "100",
    pageNo: String(pageNo),
    lDongRegnCd,
    contentTypeId,
    arrange: "Q",
  });

  const res = await fetch(`${BASE_URL}/areaBasedList2?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const header = data?.response?.header;
  if (header?.resultCode !== "0000") {
    throw new Error(`API 오류 [${header?.resultCode}]: ${header?.resultMsg}`);
  }

  const body = data?.response?.body;
  const items = body?.items?.item ?? [];
  const totalCount = body?.totalCount ?? 0;

  return { items: Array.isArray(items) ? items : [items], totalCount };
}

async function upsertDestinations(items, areaCode) {
  const rows = items.map((item) => ({
    content_id: String(item.contentid),
    content_type_id: String(item.contenttypeid),
    title: item.title || "",
    addr1: item.addr1 || "",
    addr2: item.addr2 || null,
    area_code: areaCode,
    sigungu_code: item.sigungucode ? String(item.sigungucode) : null,
    mapx: item.mapx ? parseFloat(item.mapx) : null,
    mapy: item.mapy ? parseFloat(item.mapy) : null,
    first_image: item.firstimage || null,
    first_image2: item.firstimage2 || null,
    cat3: item.cat3 || null,
    tel: item.tel || null,
    cached_at: new Date().toISOString(),
  }));

  const { error, count } = await supabase
    .from("destinations")
    .upsert(rows, { onConflict: "content_id", count: "exact" });

  if (error) throw error;
  return count ?? rows.length;
}

async function syncArea(areaCode, contentTypeId) {
  const first = await fetchAreaBasedList(areaCode, contentTypeId, 1);
  let upserted = await upsertDestinations(first.items, areaCode);

  const totalPages = Math.ceil(first.totalCount / 100);
  for (let p = 2; p <= totalPages; p++) {
    const { items } = await fetchAreaBasedList(areaCode, contentTypeId, p);
    upserted += await upsertDestinations(items, areaCode);
    await new Promise((r) => setTimeout(r, 200));
  }

  return upserted;
}

async function main() {
  console.log("🗺️  여행지 데이터 수집 시작 (KorService2)...\n");
  let totalUpserted = 0;

  for (const areaCode of AREA_CODES) {
    for (const contentTypeId of CONTENT_TYPES) {
      try {
        const count = await syncArea(areaCode, contentTypeId);
        totalUpserted += count;
        console.log(`✅ 지역 ${areaCode} / 타입 ${contentTypeId}: ${count}건`);
      } catch (err) {
        console.error(`❌ 지역 ${areaCode} / 타입 ${contentTypeId}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`\n🎉 완료! 총 ${totalUpserted}건 upsert`);
}

main().catch(console.error);
