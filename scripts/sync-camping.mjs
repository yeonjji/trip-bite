// 캠핑장 데이터 수집 스크립트 (고캠핑 API)
// 실행: node --env-file=.env.local scripts/sync-camping.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CAMPING_API_KEY = process.env.PUBLIC_DATA_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !CAMPING_API_KEY) {
  console.error("필수 환경변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BASE_URL = "https://apis.data.go.kr/B551011/GoCamping";

async function fetchCampingList(pageNo = 1) {
  const params = new URLSearchParams({
    serviceKey: CAMPING_API_KEY,
    MobileOS: "ETC",
    MobileApp: "TripBite",
    _type: "json",
    numOfRows: "1000",
    pageNo: String(pageNo),
  });

  const res = await fetch(`${BASE_URL}/basedList?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const header = data?.response?.header;
  if (header?.resultCode !== "0000") {
    throw new Error(`API 오류 [${header?.resultCode}]: ${header?.resultMsg}`);
  }

  const body = data?.response?.body;
  const raw = body?.items;
  const items = !raw || raw === "" ? [] : Array.isArray(raw.item) ? raw.item : [raw.item];
  return { items, totalCount: body?.totalCount ?? 0 };
}

async function upsertCamping(items) {
  const rows = items.map((item) => ({
    content_id: String(item.contentId),
    faclt_nm: item.facltNm || "",
    line_intro: item.lineIntro || null,
    do_nm: item.doNm || "",
    sigungu_nm: item.sigunguNm || "",
    addr1: item.addr1 || "",
    addr2: item.addr2 || null,
    mapx: item.mapX ? parseFloat(item.mapX) : null,
    mapy: item.mapY ? parseFloat(item.mapY) : null,
    tel: item.tel || null,
    homepage: item.homepage || null,
    first_image_url: item.firstImageUrl || null,
    induty: item.induty || null,
    sbrs_cl: item.sbrsCl || null,
    animal_cmg_cl: item.animalCmgCl || null,
    brazier_cl: item.brazierCl || null,
    site_bottom_cl1: item.siteBottomCl1 ? parseInt(item.siteBottomCl1) : null,
    site_bottom_cl2: item.siteBottomCl2 ? parseInt(item.siteBottomCl2) : null,
    site_bottom_cl3: item.siteBottomCl3 ? parseInt(item.siteBottomCl3) : null,
    site_bottom_cl4: item.siteBottomCl4 ? parseInt(item.siteBottomCl4) : null,
    site_bottom_cl5: item.siteBottomCl5 ? parseInt(item.siteBottomCl5) : null,
    gnrl_site_co: item.gnrlSiteCo ? parseInt(item.gnrlSiteCo) : null,
    auto_site_co: item.autoSiteCo ? parseInt(item.autoSiteCo) : null,
    glamp_site_co: item.glampSiteCo ? parseInt(item.glampSiteCo) : null,
    carav_site_co: item.caravSiteCo ? parseInt(item.caravSiteCo) : null,
    cached_at: new Date().toISOString(),
  }));

  const { error, count } = await supabase
    .from("camping_sites")
    .upsert(rows, { onConflict: "content_id", count: "exact" });

  if (error) throw error;
  return count ?? rows.length;
}

async function main() {
  console.log("🏕️  캠핑장 데이터 수집 시작...\n");

  const first = await fetchCampingList(1);
  let total = await upsertCamping(first.items);
  console.log(`페이지 1: ${first.items.length}건 (전체 ${first.totalCount}건)`);

  const totalPages = Math.ceil(first.totalCount / 100);
  for (let p = 2; p <= totalPages; p++) {
    const { items } = await fetchCampingList(p);
    const count = await upsertCamping(items);
    total += count;
    console.log(`페이지 ${p}/${totalPages}: ${items.length}건`);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n🎉 완료! 총 ${total}건 upsert`);
}

main().catch(console.error);
