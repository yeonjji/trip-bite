/**
 * 공공 와이파이 표준데이터 동기화 스크립트
 *
 * 실행: node --env-file=.env.local scripts/sync-free-wifi.mjs
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * CSV: src/data/freeWifi.csv (EUC-KR 인코딩)
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

// 설치시도명 → 법정동 area_code 매핑
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
  "충청남도": "44",
  "전라북도": "52",
  "전북특별자치도": "52",
  "전라남도": "46",
  "경상북도": "47",
  "경상남도": "48",
  "제주특별자치도": "50",
};

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

async function main() {
  const csvPath = path.join(__dirname, "../src/data/freeWifi.csv");
  console.log("📶 공공 와이파이 데이터 동기화 시작...");

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
    if (cols.length < 5) { skipped++; continue; }

    const manageNo = cols[idx["관리번호"]]?.trim();
    if (!manageNo) { skipped++; continue; }

    const sidoName = cols[idx["설치시도명"]]?.trim() ?? "";

    batch.push({
      manage_no:     manageNo,
      place_name:    cols[idx["설치장소명"]]?.trim() ?? "",
      place_detail:  cols[idx["설치장소상세"]]?.trim() || null,
      sido_name:     sidoName || null,
      sigungu_name:  cols[idx["설치시군구명"]]?.trim() || null,
      facility_type: cols[idx["설치시설구분명"]]?.trim() || null,
      provider:      cols[idx["서비스제공사명"]]?.trim() || null,
      ssid:          cols[idx["와이파이SSID"]]?.trim() || null,
      address_road:  cols[idx["소재지도로명주소"]]?.trim() || null,
      address_jibun: cols[idx["소재지지번주소"]]?.trim() || null,
      lat:           (v => (!isNaN(v) && v >= 30 && v <= 40) ? v : null)(parseFloat(cols[idx["WGS84위도"]])),
      lng:           (v => (!isNaN(v) && v >= 124 && v <= 132) ? v : null)(parseFloat(cols[idx["WGS84경도"]])),
      area_code:     SIDO_TO_AREA_CODE[sidoName] ?? null,
      updated_at:    new Date().toISOString(),
    });

    if (batch.length >= BATCH) {
      const { error } = await supabase
        .from("free_wifi")
        .upsert(batch.splice(0, BATCH), { onConflict: "manage_no" });
      if (error) throw error;
      synced += BATCH;
      process.stdout.write(`\r  진행: ${synced.toLocaleString()} / ${total.toLocaleString()}`);
    }
  }

  if (batch.length > 0) {
    const { error } = await supabase
      .from("free_wifi")
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
