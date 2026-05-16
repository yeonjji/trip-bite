# Step 3b — 전국 지하철역 마스터 + TransitSection DB-first 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전국도시철도역사정보표준데이터(CSV)를 `subway_stations` 마스터 테이블로 적재하고 PostGIS RPC로 좌표 주변 검색을 제공해, 상세 페이지 `TransitSection`이 매 요청 Kakao 카테고리 검색(SW8)을 호출하던 것을 DB-only 호출로 전환한다.

**Architecture:** 운영자가 data.go.kr에서 CSV를 다운로드해 `scripts/data/subway-stations.csv`에 커밋 → `sync-subway-stations.mjs`가 파싱 후 Supabase upsert → PostGIS `get_nearby_subway` RPC가 좌표+반경으로 가까운 역 반환 → `TransitSection`은 새 데이터 함수만 호출 (외부 API 0). 동일 패턴이 `nearby_facilities` (화장실/와이파이/주차/EV)에서 검증됨.

**Tech Stack:** Supabase PostgreSQL + PostGIS, Node.js ESM (CSV 파싱), Next.js 15 App Router (Server Component), TypeScript.

**Spec reference:** `docs/superpowers/specs/2026-05-15-db-first-external-api-audit.md` (Category B — TransitSection)

**Data source:** [전국도시철도역사정보표준데이터](https://www.data.go.kr/data/15013205/standard.do) (CSV 일괄 다운로드)

**Verification:** 프로젝트에 테스트 프레임워크 미설정. 각 task는 `pnpm exec tsc --noEmit` + `pnpm exec eslint <files>` + 최종 `pnpm build`로 검증. 마이그레이션은 SQL syntax review.

---

## File Structure

### 신규 파일
| 파일 | 역할 |
|---|---|
| `supabase/migrations/039_subway_stations.sql` | 테이블 + GIST 인덱스 + `get_nearby_subway` RPC + RLS |
| `scripts/data/subway-stations.csv` | 운영자가 data.go.kr에서 다운로드 후 UTF-8로 변환 + 커밋 (각자 환경에서 1회) |
| `scripts/sync-subway-stations.mjs` | CSV 파싱 + upsert. 멱등(content_id 단위). |
| `src/lib/data/subway.ts` | `getNearbySubway(lat, lng, radius?, limit?)` 데이터 함수 |

### 수정 파일
| 파일 | 변경 |
|---|---|
| `src/components/transit/TransitSection.tsx` | `searchNearbyTransit` 호출 → `getNearbySubway` 호출. 응답 shape는 컴포넌트 내부에서 흡수. |
| `src/lib/api/kakao-api.ts` | `searchNearbyTransit` 함수 + 관련 타입 제거 (다른 호출처 0 확인 후) |

### 비목표 (별도 plan/PR)
- KakaoLinkSection의 `searchKakaoPlace` 캐싱 (Step 3a 별도 plan)
- subway-stations 데이터셋 자동 다운로드 — 표준데이터셋이라 분기/연 단위 변경, 수동 갱신으로 충분
- 노선별 부가 정보(환승, 출입구) — 본 plan은 "주변 지하철역" UX에 필요한 최소(역명/노선/좌표/거리/지도링크)만

---

## Task 1: 마이그레이션 — `subway_stations` 테이블 + RPC

**Files:** Create `supabase/migrations/039_subway_stations.sql`.

**Context:**
- `nearby_facilities` 패턴(toilets/wifi/parking/ev)을 그대로 따라감
- 핵심: `location geography(point, 4326)` + `GIST` 인덱스 + `ST_DWithin` 기반 RPC
- station_id는 표준데이터셋의 "역사번호" (전국 unique)
- RLS: anonymous read 허용

### Steps

- **Step 1: 다음 마이그레이션 번호 확인**

Run: `ls supabase/migrations/ | tail -3`
Expected last: `038_destinations_intro_image.sql`. 다음 번호 = `039`.

- **Step 2: 마이그레이션 파일 작성**

Create `supabase/migrations/039_subway_stations.sql` with this exact content:

```sql
-- Step 3b: 전국 지하철역 마스터 + 좌표 주변 검색 RPC
-- 출처: 공공데이터포털 "전국도시철도역사정보표준데이터" (CSV 일괄 적재)
-- 패턴: nearby_facilities (toilets/wifi/parking/ev) 동일

create table if not exists public.subway_stations (
  id              uuid primary key default gen_random_uuid(),
  station_id      text not null unique,
  station_name    text not null,
  line_name       text not null default '',
  road_address    text,
  jibun_address   text,
  lat             numeric(10, 7) not null,
  lng             numeric(11, 7) not null,
  location        geography(point, 4326),
  agency          text,
  phone           text,
  cached_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger set_subway_stations_updated_at
  before update on public.subway_stations
  for each row execute function public.set_updated_at();

create index if not exists subway_stations_station_id_idx on public.subway_stations(station_id);
create index if not exists subway_stations_location_idx on public.subway_stations using gist(location);

alter table public.subway_stations enable row level security;
create policy "Anyone can read subway_stations"
  on public.subway_stations for select using (true);

-- upsert 시 location 컬럼을 lat/lng로부터 자동 채우는 트리거
create or replace function public.subway_stations_set_location()
returns trigger language plpgsql as $$
begin
  new.location := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

drop trigger if exists subway_stations_set_location_trg on public.subway_stations;
create trigger subway_stations_set_location_trg
  before insert or update of lat, lng on public.subway_stations
  for each row execute function public.subway_stations_set_location();

-- 좌표 주변 N미터 이내 지하철역 (거리 순 정렬)
create or replace function public.get_nearby_subway(
  p_lat numeric,
  p_lng numeric,
  radius_meters int default 2000,
  result_limit int default 5
)
returns table (
  station_id text,
  station_name text,
  line_name text,
  road_address text,
  jibun_address text,
  lat numeric,
  lng numeric,
  distance_m int
)
language sql stable as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng::float8, p_lat::float8), 4326)::geography g
  )
  select
    s.station_id,
    s.station_name,
    s.line_name,
    s.road_address,
    s.jibun_address,
    s.lat,
    s.lng,
    st_distance(s.location, origin.g)::int as distance_m
  from public.subway_stations s, origin
  where st_dwithin(s.location, origin.g, radius_meters)
  order by s.location <-> origin.g
  limit result_limit;
$$;
```

- **Step 3: 파일 확인**

Run: `cat supabase/migrations/039_subway_stations.sql | head -30`
Expected: 위 SQL의 처음 30라인.

- **Step 4: Commit**

```bash
git add supabase/migrations/039_subway_stations.sql
git commit -m "$(cat <<'EOF'
feat: subway_stations 테이블 + get_nearby_subway RPC 추가

전국도시철도역사정보표준데이터(공공데이터포털 #15013205)를
적재할 마스터 테이블. PostGIS GIST 인덱스 + ST_DWithin 기반 RPC.
nearby_facilities 패턴과 동일.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 운영자 수동 작업 — CSV 다운로드 + 위치 설정

**Files (operator action, plan-level docs):** `scripts/data/subway-stations.csv`

**Context:** 표준데이터셋은 분기/연 단위로 갱신되므로 수동 다운로드 + 커밋이 가장 단순. CSV가 commit되어 있으면 sync 스크립트가 그걸 읽음.

### Steps (sequence — operator-side, NOT executed by agent)

- **Step 1: CSV 다운로드**

[전국도시철도역사정보표준데이터](https://www.data.go.kr/data/15013205/standard.do) 페이지 접속 → "다운로드" 버튼 → CSV 파일 (보통 EUC-KR 인코딩).

- **Step 2: UTF-8 변환 (필요한 경우)**

```bash
# macOS/Linux:
iconv -f euc-kr -t utf-8 다운로드된_파일.csv > scripts/data/subway-stations.csv

# 만약 이미 UTF-8이면:
mv 다운로드된_파일.csv scripts/data/subway-stations.csv
```

- **Step 3: 위치 디렉토리 + 첫 줄 확인**

```bash
mkdir -p scripts/data
head -2 scripts/data/subway-stations.csv
```

Expected: 첫 줄에 `역사번호,역사명,노선번호,노선명,...,위도,경도,...` 형태의 헤더. 둘째 줄에 첫 역 데이터.

- **Step 4: Commit (operator)**

```bash
git add scripts/data/subway-stations.csv
git commit -m "data: 전국도시철도역사정보표준데이터 CSV 추가 (공공데이터포털)"
```

**중요:** agent는 CSV 파일을 갖고 있지 않음. operator가 위 step을 끝내고 CSV가 커밋된 상태에서 Task 3을 dispatch해야 함.

만약 agent가 Task 3 dispatch 시 CSV가 없으면 BLOCKED 상태로 보고하고, 운영자가 CSV 추가 후 재시도.

---

## Task 3: `sync-subway-stations.mjs` — CSV 파싱 + upsert

**Files:** Create `scripts/sync-subway-stations.mjs`.

**Context:**
- `scripts/data/subway-stations.csv`를 읽어서 Supabase에 upsert
- CSV는 표준데이터셋 컬럼 사용: `역사번호`, `역사명`, `노선번호`, `노선명`, `도로명주소`, `지번주소`, `위도`, `경도`, `운영기관명`, `전화번호`
- 헤더 컬럼명이 데이터셋 버전마다 약간 다를 수 있어 키워드 매칭으로 컬럼 인덱스 찾기 (예: `위도` 포함 컬럼)
- `station_id`로 upsert (이미 있으면 update)

### Steps

- **Step 1: CSV 존재 확인**

```bash
ls scripts/data/subway-stations.csv 2>&1
```
Expected: `scripts/data/subway-stations.csv` (file exists). 없으면 STOP and report BLOCKED — Task 2가 안 끝남.

- **Step 2: 헤더 확인 (parser 작성용)**

```bash
head -1 scripts/data/subway-stations.csv
```
헤더에 다음 키워드가 포함된 컬럼이 있어야 함: `역번호`, `역사명`, `노선명`, `위도`, `경도`.

- **Step 3: 스크립트 작성**

Create `scripts/sync-subway-stations.mjs` with this exact content:

```js
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

  const rows = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const stationId = fields[idx.stationId]?.trim();
    const stationName = fields[idx.stationName]?.trim();
    const lat = parseFloat(fields[idx.lat]);
    const lng = parseFloat(fields[idx.lng]);

    if (!stationId || !stationName || isNaN(lat) || isNaN(lng)) {
      skipped++;
      continue;
    }

    rows.push({
      station_id:    stationId,
      station_name:  stationName,
      line_name:     fields[idx.lineName]?.trim() ?? "",
      road_address:  idx.roadAddress >= 0 ? fields[idx.roadAddress]?.trim() || null : null,
      jibun_address: idx.jibunAddress >= 0 ? fields[idx.jibunAddress]?.trim() || null : null,
      lat,
      lng,
      agency:        idx.agency >= 0 ? fields[idx.agency]?.trim() || null : null,
      phone:         idx.phone >= 0 ? fields[idx.phone]?.trim() || null : null,
      cached_at:     new Date().toISOString(),
    });
  }

  console.log(`파싱 완료: ${rows.length}건, 스킵 ${skipped}건 (필수 필드 누락)`);

  let totalUpserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from("subway_stations")
      .upsert(batch, { onConflict: "station_id", count: "exact" });
    if (error) {
      console.error(`  ❌ batch ${i}~${i + batch.length}: ${error.message}`);
      continue;
    }
    totalUpserted += count ?? batch.length;
    console.log(`  진행: ${totalUpserted}/${rows.length}`);
  }

  console.log(`\n🎉 완료! 업서트 ${totalUpserted}건 / 스킵 ${skipped}건`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- **Step 4: Syntax check**

Run: `node --check scripts/sync-subway-stations.mjs`
Expected: exit 0, no output.

- **Step 5: Commit**

```bash
git add scripts/sync-subway-stations.mjs
git commit -m "$(cat <<'EOF'
feat: sync-subway-stations.mjs — 전국 지하철역 CSV 적재

scripts/data/subway-stations.csv를 파싱해 subway_stations 테이블 upsert.
헤더 컬럼명 키워드 매칭(역사번호/역사명/노선명/위도/경도 등).
표준데이터셋 갱신 시 CSV 교체 후 본 스크립트 재실행.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 데이터 함수 — `getNearbySubway`

**Files:** Create `src/lib/data/subway.ts`.

**Context:**
- 좌표를 받아 `get_nearby_subway` RPC 호출 → 가까운 지하철역 배열 반환
- 응답 shape는 RPC의 RETURNS TABLE과 일치
- 패턴은 `src/lib/data/nearby-facilities.ts`의 `getNearbyFacilitiesCached`와 유사 (단, anon client는 본 함수에서는 server cookie client만 사용해도 됨 — 캐싱 추가는 후속에서)

### Steps

- **Step 1: 파일 작성**

Create `src/lib/data/subway.ts` with this exact content:

```ts
import { createClient } from "@/lib/supabase/server";

export interface NearbySubway {
  station_id: string;
  station_name: string;
  line_name: string;
  road_address: string | null;
  jibun_address: string | null;
  lat: number;
  lng: number;
  distance_m: number;
}

/**
 * 좌표 주변 지하철역을 거리 순으로 반환.
 *
 * Source of truth: subway_stations 테이블 (sync-subway-stations.mjs로 적재).
 * 외부 API 호출 없음 — PostGIS RPC 1회.
 */
export async function getNearbySubway(
  lat: number,
  lng: number,
  radiusMeters = 2000,
  limit = 5,
): Promise<NearbySubway[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_nearby_subway", {
    p_lat: lat,
    p_lng: lng,
    radius_meters: radiusMeters,
    result_limit: limit,
  });
  if (error) {
    console.error("[getNearbySubway] RPC error:", error.message);
    return [];
  }
  return (data as NearbySubway[]) ?? [];
}
```

- **Step 2: Type check**

```bash
pnpm exec tsc --noEmit
```
Expected: exit 0.

- **Step 3: Lint**

```bash
pnpm exec eslint src/lib/data/subway.ts
```
Expected: no output.

- **Step 4: Commit**

```bash
git add src/lib/data/subway.ts
git commit -m "$(cat <<'EOF'
feat: getNearbySubway 데이터 함수 추가

subway_stations 테이블의 get_nearby_subway RPC를 호출.
TransitSection에서 외부 Kakao API 대신 사용 (다음 commit).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `TransitSection` — DB-first 전환

**Files:** Modify `src/components/transit/TransitSection.tsx`.

**Context:**
- 현재: `searchNearbyTransit(lat, lng, "SW8")` 호출 → `KakaoTransitPlace[]` 받아 표시
- 신규: `getNearbySubway(lat, lng)` 호출 → `NearbySubway[]` 받아 표시
- UI는 거리 + 역명 + 카카오맵/네이버맵 deeplink 유지

### Steps

- **Step 1: 현재 컴포넌트 전체 읽기**

```bash
cat src/components/transit/TransitSection.tsx
```
파일 끝까지 확인 (위에서 head -40만 봤었음). 컴포넌트가 어떤 필드(`place_url`, `place_name`, `distance`)를 사용하는지 확인.

- **Step 2: 전면 교체**

`src/components/transit/TransitSection.tsx` 파일 전체를 다음 내용으로 교체:

```tsx
import { getNearbySubway } from "@/lib/data/subway"
import { formatDistanceM } from "@/lib/utils/haversine"

interface Props {
  lat: number
  lng: number
  locale: string
}

function buildNaverMapUrl(stationName: string, lat: number, lng: number) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(stationName)}?c=${lng},${lat},15,0,0,0,dh`
}

function buildKakaoMapUrl(stationName: string, lat: number, lng: number) {
  return `https://map.kakao.com/?q=${encodeURIComponent(stationName)}&urlX=${lng}&urlY=${lat}`
}

export default async function TransitSection({ lat, lng, locale }: Props) {
  const isKo = locale === "ko"
  const stations = await getNearbySubway(lat, lng)

  return (
    <div>
      <h2 className="mb-2 font-headline text-xl font-bold text-[#1B1C1A]">
        {isKo ? "주변 지하철역" : "Nearby Subway"}
      </h2>

      {stations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isKo ? "근처 지하철 정보가 없습니다." : "No nearby subway stations."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {stations.map((station) => (
            <a
              key={station.station_id}
              href={buildKakaoMapUrl(station.station_name, station.lat, station.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-[#F9F7EF] px-4 py-3 transition-colors hover:bg-[#FFEDE7]"
            >
              <span className="truncate text-sm font-medium text-[#1B1C1A]">
                🚇 {station.station_name}
                {station.line_name && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({station.line_name})
                  </span>
                )}
              </span>
              <span className="ml-3 shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                {formatDistanceM(station.distance_m)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

**주의:**
- `buildNaverMapUrl`은 정의하되 사용 안 함 (필요 시 후속 카카오/네이버 토글 옵션). 일단 카카오맵 deeplink만 사용.
- 만약 Step 1에서 본 원본 파일이 다른 마무리(예: 더 많은 안내문)를 가지면 보존. 본 plan은 핵심 UI만 다룸.

만약 원본의 마무리 부분에 추가 콘텐츠가 있으면 BLOCKED 상태로 보고하고 어떤 부분을 살릴지 controller에게 문의.

- **Step 3: Type check**

```bash
pnpm exec tsc --noEmit
```
Expected: exit 0.

- **Step 4: Lint**

```bash
pnpm exec eslint src/components/transit/TransitSection.tsx
```
Expected: no output.

- **Step 5: Commit**

```bash
git add src/components/transit/TransitSection.tsx
git commit -m "$(cat <<'EOF'
perf: TransitSection DB-first 전환 (Kakao API 호출 제거)

subway_stations 테이블 + get_nearby_subway RPC만 사용.
역명에 노선명 표시 추가, 카카오맵 deeplink 유지.
외부 호출 0 — sync-subway-stations.mjs가 source of truth.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Cleanup — `searchNearbyTransit` 제거

**Files:** Modify `src/lib/api/kakao-api.ts`.

**Context:**
- Task 5 후 `searchNearbyTransit`은 dead code가 될 가능성이 큼
- `searchKakaoPlace`는 KakaoLinkSection이 여전히 사용 (Step 3a plan에서 처리 예정)

### Steps

- **Step 1: 호출처 0 확인**

```bash
git grep -n "searchNearbyTransit" -- "src/"
```
Expected: `src/lib/api/kakao-api.ts:<line>: export async function searchNearbyTransit(` 1줄만 — 정의만 있음.

만약 다른 줄이 나오면 STOP and report — 어디서 아직 호출하는지 controller에게 보고.

- **Step 2: `searchNearbyTransit` 함수 + 관련 타입 제거**

`src/lib/api/kakao-api.ts`에서 다음 블록들을 제거:

```ts
export interface KakaoTransitPlace {
  id: string
  place_name: string
  place_url: string
  distance: string // meters as string
}

interface KakaoCategoryResponse {
  documents: (KakaoTransitPlace & { category_group_code: string })[]
  meta: { total_count: number }
}
```

```ts
export async function searchNearbyTransit(
  lat: number,
  lng: number,
  categoryCode: "SW8",
  radius = 1000,
  size = 5
): Promise<KakaoTransitPlace[]> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({
      category_group_code: categoryCode,
      x: String(lng),
      y: String(lat),
      radius: String(radius),
      sort: "distance",
      size: String(size),
    })

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?${params}`,
      {
        next: { revalidate: 86400 },
        headers: { Authorization: `KakaoAK ${key}` },
      }
    )

    if (!res.ok) return []

    const data: KakaoCategoryResponse = await res.json()
    return data.documents ?? []
  } catch {
    return []
  }
}
```

남는 export는 `searchKakaoPlace` + `KakaoPlace` + `KakaoSearchResponse`.

- **Step 3: Type check**

```bash
pnpm exec tsc --noEmit
```
Expected: 0 errors (다른 곳에서 `KakaoTransitPlace`나 `searchNearbyTransit` import 없으면).

만약 errors가 나오면 import 라인을 찾아 제거 (이미 위 Step 1에서 grep으로 확인했지만 안전 차원에서 한 번 더).

- **Step 4: Lint**

```bash
pnpm exec eslint src/lib/api/kakao-api.ts
```
Expected: no output.

- **Step 5: Commit**

```bash
git add src/lib/api/kakao-api.ts
git commit -m "$(cat <<'EOF'
refactor: searchNearbyTransit 함수 제거 (호출처 0개)

TransitSection이 PostGIS RPC로 전환되면서 본 함수 dead code.
관련 타입(KakaoTransitPlace, KakaoCategoryResponse)도 함께 정리.
searchKakaoPlace는 KakaoLinkSection이 사용 중이라 유지 (Step 3a 대상).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: 종합 검증 + 운영자 가이드

**Files:** 없음 (verification + runbook)

### Steps

- **Step 1: 전체 type check**

```bash
pnpm exec tsc --noEmit
```
Expected: 0 errors.

- **Step 2: 변경/신규 파일 lint**

```bash
pnpm exec eslint \
  src/lib/data/subway.ts \
  src/components/transit/TransitSection.tsx \
  src/lib/api/kakao-api.ts
```
Expected: no output.

- **Step 3: Production build**

```bash
pnpm build
```
Expected: exit 0.

- **Step 4: 회귀 grep — Kakao 카테고리 호출 잔재 없음**

```bash
grep -rn "searchNearbyTransit\|search/category.json\|SW8" src/
```
Expected: 0 hits. (kakao-api.ts에서 함수 자체가 삭제됨.)

- **Step 5: 커밋 로그 확인**

```bash
git log --oneline main..HEAD
```
Expected: 6개 commit (Task 1 마이그레이션, Task 3 sync 스크립트, Task 4 데이터 함수, Task 5 TransitSection 교체, Task 6 cleanup, Task 2의 CSV 커밋은 operator가 직접 — branch에 포함될 수도 있음).

- **Step 6: 운영자 deploy 가이드** (PR 본문 + 운영 runbook용)

PR 머지 후 운영자가 수행:

1. **마이그레이션 적용** — Supabase 콘솔 또는 CLI:
   ```bash
   supabase db push
   ```
   또는 콘솔에서 `039_subway_stations.sql` 직접 실행.

2. **CSV 다운로드 + 커밋** (이미 안 했다면 Task 2 절차 따라):
   - data.go.kr에서 표준데이터셋 CSV 다운로드
   - UTF-8 변환 후 `scripts/data/subway-stations.csv`에 놓기
   - 커밋 + push

3. **백필 실행**:
   ```bash
   node --env-file=.env.local scripts/sync-subway-stations.mjs
   ```
   예상: "🎉 완료! 업서트 N건" 메시지. 전국 ~700~1000개 역.

4. **검증 SQL** (Supabase 콘솔):
   ```sql
   select count(*) from public.subway_stations;
   select * from public.get_nearby_subway(37.5665, 126.9780, 2000, 5);  -- 서울시청 좌표 테스트
   ```
   둘째 쿼리 결과에 시청역, 을지로입구역 등이 거리 순으로 나오면 정상.

5. **상세 페이지 확인**: 임의 travel/[id] 페이지 접속 → "주변 지하철역" 섹션이 DB에서 즉시 응답 (이전엔 Kakao API 호출).

검증이 모두 통과하면 plan 완료.

---

## Self-Review

### Spec coverage
| Spec section | 대응 task |
|---|---|
| Category B: `TransitSection` Kakao 카테고리(SW8) | Task 1 (DB+RPC) + Task 3 (sync) + Task 4 (데이터 함수) + Task 5 (컴포넌트 교체) |
| 공통 패턴 §4 — `nearby_facilities` 동일 패턴 | Task 1의 RPC가 `nearby_facilities` 와 같은 ST_DWithin 구조 |
| 위험요소: 표준데이터셋 갱신 시 동기화 | Task 2 (CSV 수동 갱신 + 재실행) |

### Placeholder scan
- 모든 step에 구체적 SQL / JS / TS / 명령어 포함
- "TBD"/"implement later" 없음
- "Similar to Task N" 없음

### Type consistency
- `subway_stations` 컬럼 ↔ RPC return ↔ `NearbySubway` 인터페이스 ↔ `TransitSection` UI props 모두 일치
- `station_id`, `station_name`, `line_name`, `lat`, `lng`, `distance_m` — 5곳 모두 동일 이름

### 알려진 한계

- **CSV 수동 다운로드 의존**: 표준데이터셋은 분기/연 단위 갱신이라 자동화 비용 대비 효용 낮음. 변경 사항(신규 역, 역명 변경)을 빠르게 반영하려면 운영자가 정기적으로 다운로드 + 커밋 필요.
- **EUC-KR/UTF-8 인코딩**: 운영자 환경에서 변환 필요할 수 있음. plan에 iconv 예시 포함.
- **노선 색상/환승 정보 미수집**: 본 plan은 "주변 지하철역" 최소 UX만. 호선별 색상 표시나 환승역 강조는 별도 plan.
- **테스트 프레임워크 부재**: 단위 테스트 작성 안 함. tsc + eslint + 빌드 + Supabase 콘솔 SQL 검증으로 대체.
- **출입구별 row 미수집**: 표준데이터셋은 역사 단위. 카카오는 출입구별 노선이 다를 수 있는데 본 plan에서는 station 단위로만 표시. 사용자 영향 거의 없음 (역 위치만 필요).
