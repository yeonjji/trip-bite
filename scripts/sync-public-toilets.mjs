/**
 * 공중화장실 표준데이터 동기화 스크립트
 *
 * 실행: node --env-file=.env.local scripts/sync-public-toilets.mjs
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * CSV: src/data/publicToilet.csv (EUC-KR 인코딩)
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 시도명(주소 첫 어절) → 법정동 area_code 매핑
const SIDO_TO_AREA_CODE = {
  "서울특별시": "11",
  "부산광역시": "26",
  "대구광역시": "27",
  "인천광역시": "28",
  "광주광역시": "29",
  "대전광역시": "30",
  "울산광역시": "31",
  "세종특별자치시": "36110",
  "경기도": "41",
  "강원도": "51",
  "강원특별자치도": "51",
  "충청북도": "43",
  "충북": "43",
  "충청남도": "44",
  "충남": "44",
  "전라북도": "52",
  "전북특별자치도": "52",
  "전라남도": "46",
  "전남": "46",
  "경상북도": "47",
  "경북": "47",
  "경상남도": "48",
  "경남": "48",
  "제주특별자치도": "50",
};

function getAreaCode(address) {
  if (!address) return null;
  const sido = address.split(" ")[0];
  return SIDO_TO_AREA_CODE[sido] ?? null;
}

// 간단한 CSV 한 줄 파서 (쌍따옴표 처리)
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function toInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function toBool(val) {
  return val === "Y";
}

async function main() {
  const csvPath = path.join(__dirname, "../src/data/publicToilet.csv");
  console.log("🚻 공중화장실 데이터 동기화 시작...");

  // EUC-KR → UTF-8 변환 (Python3, 잘못된 바이트는 무시)
  const content = execSync(
    `python3 -c "import sys; open('/dev/stdout','wb').write(open('${csvPath}','rb').read().decode('euc-kr','ignore').encode('utf-8'))"`,
    { maxBuffer: 200 * 1024 * 1024 }
  ).toString();
  const lines = content.split("\n").filter((l) => l.trim());

  const headers = parseCSVLine(lines[0]);
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

  const total = lines.length - 1;
  console.log(`  총 ${total.toLocaleString()}개 레코드`);

  const BATCH = 200;
  const batch = [];
  let synced = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) { skipped++; continue; }

    const manageNo = cols[idx["관리번호"]]?.trim();
    if (!manageNo) { skipped++; continue; }

    const addrRoad = cols[idx["소재지도로명주소"]]?.trim() ?? "";
    const addrJibun = cols[idx["소재지지번주소"]]?.trim() ?? "";
    const address = addrRoad || addrJibun;

    batch.push({
      manage_no:       manageNo,
      name:            cols[idx["화장실명"]]?.trim() ?? "",
      address_road:    addrRoad,
      address_jibun:   addrJibun,
      lat:             (v => (!isNaN(v) && v >= 30 && v <= 40) ? v : null)(parseFloat(cols[idx["WGS84위도"]])),
      lng:             (v => (!isNaN(v) && v >= 124 && v <= 132) ? v : null)(parseFloat(cols[idx["WGS84경도"]])),
      area_code:       getAreaCode(address),
      manage_org:      cols[idx["관리기관명"]]?.trim() || null,
      phone:           cols[idx["전화번호"]]?.trim() || null,
      open_time:       cols[idx["개방시간"]]?.trim() || null,
      open_time_detail: cols[idx["개방시간상세"]]?.trim() || null,
      male_toilets:    toInt(cols[idx["남성용-대변기수"]]),
      female_toilets:  toInt(cols[idx["여성용-대변기수"]]),
      disabled_male:   toInt(cols[idx["남성용-장애인용대변기수"]]),
      disabled_female: toInt(cols[idx["여성용-장애인용대변기수"]]),
      baby_care:       toBool(cols[idx["기저귀교환대유무"]]),
      cctv:            toBool(cols[idx["화장실입구CCTV설치유무"]]),
      emergency_bell:  toBool(cols[idx["비상벨설치여부"]]),
      updated_at:      new Date().toISOString(),
    });

    if (batch.length >= BATCH) {
      const { error } = await supabase
        .from("public_toilets")
        .upsert(batch.splice(0, BATCH), { onConflict: "manage_no" });
      if (error) throw error;
      synced += BATCH;
      process.stdout.write(`\r  진행: ${synced.toLocaleString()} / ${total.toLocaleString()}`);
    }
  }

  if (batch.length > 0) {
    const { error } = await supabase
      .from("public_toilets")
      .upsert(batch, { onConflict: "manage_no" });
    if (error) throw error;
    synced += batch.length;
  }

  console.log(`\n✅ 동기화 완료: ${synced.toLocaleString()}개 (건너뜀: ${skipped}개)`);
}

main().catch((e) => {
  console.error("❌ 동기화 실패:", e);
  process.exit(1);
});
