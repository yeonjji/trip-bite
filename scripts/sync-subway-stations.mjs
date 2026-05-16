// 전국도시철도역사정보표준데이터 CSV → subway_stations 테이블 upsert
// 실행: node --env-file=.env.local scripts/sync-subway-stations.mjs
//
// CSV 위치: scripts/data/subway-stations.csv (operator가 사전에 커밋)
// 표준데이터셋이라 분기/연 단위 갱신. 변경 시 CSV 교체 후 본 스크립트 재실행.

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("필수 환경변수가 없습니다 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(__dirname, "data", "subway-stations.csv");
const BATCH_SIZE = 500;

// 매우 단순한 CSV 파서 — 따옴표로 감싼 필드 + 그 안의 쉼표 처리.
// 표준데이터셋이라 필드 내 개행은 거의 없음. 있으면 별도 처리 추가 필요.
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function findColumn(header, keyword) {
  const idx = header.findIndex((h) => h.includes(keyword));
  if (idx < 0) {
    throw new Error(`헤더에서 '${keyword}' 컬럼을 찾을 수 없습니다. 헤더: ${header.join(", ")}`);
  }
  return idx;
}

async function main() {
  console.log("🚇 subway_stations 동기화 시작...\n");
  console.log(`CSV: ${CSV_PATH}`);

  let raw;
  try {
    raw = await readFile(CSV_PATH, "utf-8");
  } catch (err) {
    console.error(`CSV 파일을 읽을 수 없습니다: ${err.message}`);
    process.exit(1);
  }

  // BOM 제거
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    console.error("CSV에 데이터 행이 없습니다.");
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const idx = {
    stationId:   findColumn(header, "역번호"),
    stationName: findColumn(header, "역사명"),
    lineName:    findColumn(header, "노선명"),
    roadAddress: header.findIndex((h) => h.includes("도로명주소")),
    jibunAddress: header.findIndex((h) => h.includes("지번주소")),
    lat:         findColumn(header, "위도"),
    lng:         findColumn(header, "경도"),
    agency:      header.findIndex((h) => h.includes("운영기관")),
    phone:       header.findIndex((h) => h.includes("전화번호")),
  };

  const byStationId = new Map();
  let skipped = 0;
  let mergedLines = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const stationId = fields[idx.stationId]?.trim();
    const stationName = fields[idx.stationName]?.trim();
    const lat = parseFloat(fields[idx.lat]);
    const lng = parseFloat(fields[idx.lng]);

    if (!stationId || !stationName || Number.isNaN(lat) || Number.isNaN(lng)) {
      skipped++;
      continue;
    }

    const newLineName = fields[idx.lineName]?.trim() ?? "";
    const existing = byStationId.get(stationId);

    if (existing) {
      // 환승역: 같은 station_id가 여러 노선에 등록됨 → line_name을 ", "로 합침
      if (newLineName && !existing.line_name.split(", ").includes(newLineName)) {
        existing.line_name = existing.line_name
          ? `${existing.line_name}, ${newLineName}`
          : newLineName;
        mergedLines++;
      }
      continue;
    }

    byStationId.set(stationId, {
      station_id:    stationId,
      station_name:  stationName,
      line_name:     newLineName,
      road_address:  idx.roadAddress >= 0 ? fields[idx.roadAddress]?.trim() || null : null,
      jibun_address: idx.jibunAddress >= 0 ? fields[idx.jibunAddress]?.trim() || null : null,
      lat,
      lng,
      agency:        idx.agency >= 0 ? fields[idx.agency]?.trim() || null : null,
      phone:         idx.phone >= 0 ? fields[idx.phone]?.trim() || null : null,
      cached_at:     new Date().toISOString(),
    });
  }

  const rows = [...byStationId.values()];
  console.log(`파싱 완료: ${rows.length}건 (환승역 노선 병합 ${mergedLines}건), 스킵 ${skipped}건`);

  let totalUpserted = 0;
  let failedBatches = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from("subway_stations")
      .upsert(batch, { onConflict: "station_id", count: "exact" });
    if (error) {
      failedBatches++;
      console.error(`  ❌ batch ${i}~${i + batch.length}: ${error.message}`);
      continue;
    }
    totalUpserted += count ?? batch.length;
    console.log(`  진행: ${totalUpserted}/${rows.length}`);
  }

  if (failedBatches > 0) {
    console.error(`\n⚠️  완료(부분 실패)! 업서트 ${totalUpserted}건 / 스킵 ${skipped}건 / 실패 batch ${failedBatches}개`);
    process.exit(1);
  }
  console.log(`\n🎉 완료! 업서트 ${totalUpserted}건 / 스킵 ${skipped}건`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
