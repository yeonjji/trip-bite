# PR1 — TourAPI 마스터 테이블 + RPC + sync 인프라 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `destination_intros` / `destination_images` 마스터 테이블 + `get_nearby_tour_items` PostGIS RPC + 두 개의 신규 sync 스크립트 + GH Actions cron을 추가한다. **페이지 코드는 손대지 않는다** (backward compatible — 기존 jsonb 컬럼은 PR3까지 유지).

**Architecture:** 신규 두 테이블 + RPC는 spec §3 그대로. Sync 스크립트는 PR #39 패턴(resume + throttle + failedBatches + HTTP/resultCode 검증)을 그대로 따름. 기존 `sync-destination-details.mjs`와 워크플로는 보존 (PR3에서 삭제).

**Tech Stack:** Supabase PostgreSQL + PostGIS, Node.js ESM (CSV/CSV-less sync scripts), GitHub Actions.

**Spec reference:** `docs/superpowers/specs/2026-05-16-tourapi-master-tables-design.md`

**Verification:** 프로젝트에 테스트 프레임워크 미설정. 각 task는 SQL syntax sanity + `node --check` + `git show --stat`로 검증.

---

## File Structure

### 신규 파일
| 파일 | 역할 |
|---|---|
| `supabase/migrations/040_destination_intros_images.sql` | `destination_intros`, `destination_images` 테이블 + RLS + 인덱스 |
| `supabase/migrations/041_get_nearby_tour_items.sql` | `get_nearby_tour_items` PostGIS RPC + GRANT EXECUTE |
| `scripts/sync-destination-intros.mjs` | `detailIntro2` → `destination_intros` upsert (resume + throttle) |
| `scripts/sync-destination-images.mjs` | `detailImage2` → `destination_images` delete-then-insert (resume + throttle) |
| `.github/workflows/sync-destination-intros.yml` | 신규 cron workflow (KST 02:00) |
| `.github/workflows/sync-destination-images.yml` | 신규 cron workflow (KST 03:00) |

### 수정/삭제 없음
**페이지 코드 손대지 않음.** 기존 `sync-destination-details.mjs` + 워크플로는 PR3에서 삭제.

### 비목표 (다음 PR)
- 페이지/컴포넌트 DB-first 전환 (PR2)
- `destinations.intro_data` / `image_data` jsonb 컬럼 drop (PR3)

---

## Task 1: 마이그레이션 040 — 마스터 테이블 2개

**Files:**
- Create: `supabase/migrations/040_destination_intros_images.sql`

**Context:** spec §3.1, §3.2. `nearby_facilities` + `subway_stations`와 같은 패턴 (RLS anon read, idempotent `if not exists`).

### Steps

- [ ] **Step 1: 다음 마이그레이션 번호 확인**

```bash
ls supabase/migrations/ | tail -3
```
Expected: `039_subway_stations.sql`이 마지막. 다음 = `040`. 만약 `040_*`이 이미 있으면 STOP.

- [ ] **Step 2: 마이그레이션 파일 작성**

Create `supabase/migrations/040_destination_intros_images.sql` with this exact content:

```sql
-- PR1: TourAPI detailIntro2 / detailImage2 결과를 endpoint별 마스터로 분리
-- 출처: 공공데이터포털 KorService2 (areaBasedList2 row 기준)

-- 1) destination_intros (1:1) — detailIntro2 결과
create table if not exists public.destination_intros (
  content_id      text primary key references public.destinations(content_id) on delete cascade,
  content_type_id text not null,
  common_fields   jsonb,
  extras          jsonb,
  synced_at       timestamptz not null default now()
);

alter table public.destination_intros enable row level security;
create policy "Anyone can read destination_intros"
  on public.destination_intros for select using (true);

-- 2) destination_images (1:N) — detailImage2 결과 (한 destination당 row N개)
create table if not exists public.destination_images (
  id          bigserial primary key,
  content_id  text not null references public.destinations(content_id) on delete cascade,
  origin_url  text not null,
  image_name  text,
  serial_num  int,
  synced_at   timestamptz not null default now()
);

create index if not exists destination_images_content_id_idx
  on public.destination_images(content_id, serial_num);

alter table public.destination_images enable row level security;
create policy "Anyone can read destination_images"
  on public.destination_images for select using (true);
```

- [ ] **Step 3: Sanity check**

```bash
cat supabase/migrations/040_destination_intros_images.sql | wc -l
```
Expected: ~30 lines.

```bash
grep -c "create table\|create policy\|create index" supabase/migrations/040_destination_intros_images.sql
```
Expected: ≥ 5 (2 tables, 2 policies, 1 index).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/040_destination_intros_images.sql
git commit -m "$(cat <<'EOF'
feat(db): destination_intros / destination_images 마스터 테이블 추가

TourAPI detailIntro2 / detailImage2 응답을 endpoint별 정규화 테이블로 분리.
intros는 1:1, images는 1:N. anon read RLS.

페이지 코드는 손대지 않음 — PR2에서 전환, PR3에서 jsonb 컬럼 drop.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 마이그레이션 041 — `get_nearby_tour_items` RPC

**Files:**
- Create: `supabase/migrations/041_get_nearby_tour_items.sql`

**Context:** spec §3.3. subway_stations RPC와 같은 패턴 (`set search_path = public, extensions`, GRANT EXECUTE).

### Steps

- [ ] **Step 1: 파일 작성**

Create `supabase/migrations/041_get_nearby_tour_items.sql` with this exact content:

```sql
-- PR1: 좌표 주변 destinations를 content_type별로 거리 순 반환하는 RPC
-- NearbyTourSection이 호출 (이전 tourApi.locationBasedList ×3 대체)

create or replace function public.get_nearby_tour_items(
  p_lat numeric,
  p_lng numeric,
  p_exclude text default null,
  p_types text[] default array['12','15','32'],
  radius_meters int default 15000,
  result_limit int default 6
)
returns table (
  content_id text,
  content_type_id text,
  title text,
  addr1 text,
  first_image text,
  lat numeric,
  lng numeric,
  distance_km numeric
)
language sql stable
set search_path = public, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng::float8, p_lat::float8), 4326)::geography g
  )
  select
    d.content_id,
    d.content_type_id,
    d.title,
    d.addr1,
    d.first_image,
    d.mapy as lat,
    d.mapx as lng,
    round((st_distance(d.location, origin.g) / 1000)::numeric, 1) as distance_km
  from public.destinations d, origin
  where d.content_type_id = any(p_types)
    and d.location is not null
    and st_dwithin(d.location, origin.g, radius_meters)
    and (p_exclude is null or d.content_id <> p_exclude)
    and d.first_image is not null
  order by d.location <-> origin.g
  limit result_limit;
$$;

grant execute on function public.get_nearby_tour_items(numeric, numeric, text, text[], int, int)
  to anon, authenticated;
```

- [ ] **Step 2: Sanity check**

```bash
grep -c "create or replace function\|grant execute" supabase/migrations/041_get_nearby_tour_items.sql
```
Expected: 2.

확인: RETURNS TABLE의 컬럼 8개 (content_id, content_type_id, title, addr1, first_image, lat, lng, distance_km).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/041_get_nearby_tour_items.sql
git commit -m "$(cat <<'EOF'
feat(db): get_nearby_tour_items RPC 추가

destinations 마스터에서 좌표 + content_type 기반 주변 콘텐츠 반환.
PostGIS ST_DWithin + GIST 인덱스 활용. anon/authenticated GRANT.

NearbyTourSection이 PR2에서 호출 예정 (tourApi.locationBasedList ×3 대체).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `sync-destination-intros.mjs`

**Files:**
- Create: `scripts/sync-destination-intros.mjs`

**Context:** spec §4.3. 기존 `sync-destination-details.mjs`에서 intro만 분리. 패턴은 `sync-destination-details.mjs`와 `sync-subway-stations.mjs`를 따름.

**Common vs extras 분리 규칙**:
- common_fields에 들어가는 키 (TourSpotDetail 공통): `infocenter, usetime, restdate, useseason, parking, accomcount, chkpet, chkbabycarriage, chkcreditcard, heritage1, heritage2, heritage3, expguide, expagerange`
- 그 외 모든 키는 extras로

### Steps

- [ ] **Step 1: 파일 작성**

Create `scripts/sync-destination-intros.mjs` with this exact content:

```js
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
```

- [ ] **Step 2: Syntax check**

```bash
node --check scripts/sync-destination-intros.mjs
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/sync-destination-intros.mjs
git commit -m "$(cat <<'EOF'
feat(sync): sync-destination-intros.mjs — detailIntro2를 destination_intros에 적재

resume(intros 없는 row만) + throttle(150ms) + failedIds 격리.
common_fields/extras 분리는 키 화이트리스트 기준.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `sync-destination-images.mjs`

**Files:**
- Create: `scripts/sync-destination-images.mjs`

**Context:** spec §4.4. detailImage2 응답이 0건이라도 "처리됨" 표시가 필요. delete-then-insert 패턴으로 멱등성 확보.

**Resume 정책**: `destination_images`에 row가 없는 destination + `destination_intros`에는 이미 적재된 destination (intros가 이미 처리됐다면 상위 메타데이터가 있는 상태). 단순화를 위해 **destinations.content_id - destination_images에서 발견된 distinct content_id**로 필터.

### Steps

- [ ] **Step 1: 파일 작성**

Create `scripts/sync-destination-images.mjs` with this exact content:

```js
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
```

- [ ] **Step 2: Syntax check**

```bash
node --check scripts/sync-destination-images.mjs
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/sync-destination-images.mjs
git commit -m "$(cat <<'EOF'
feat(sync): sync-destination-images.mjs — detailImage2를 destination_images에 적재

delete-then-insert 멱등 처리. 빈 응답 시 row 0건.
resume(images 없는 row만) + throttle + failedIds 격리.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: GH Actions workflow 추가 (2개)

**Files:**
- Create: `.github/workflows/sync-destination-intros.yml`
- Create: `.github/workflows/sync-destination-images.yml`

**Context:** spec §4.5. 두 step 한 workflow가 아닌 두 개 workflow로 분리 — 각각 timeout/실패 추적 독립. KST 02:00(intros) + 03:00(images).

### Steps

- [ ] **Step 1: intros workflow**

Create `.github/workflows/sync-destination-intros.yml` with this exact content:

```yaml
name: sync-destination-intros

# detailIntro2 적재 — destination_intros에 row 없는 destination만 처리
# KST 02:00 (UTC 17:00) 매일 실행. 수동 실행도 가능.

on:
  schedule:
    - cron: "0 17 * * *"
  workflow_dispatch:

jobs:
  backfill:
    runs-on: ubuntu-latest
    timeout-minutes: 350

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run backfill
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          PUBLIC_DATA_API_KEY: ${{ secrets.PUBLIC_DATA_API_KEY }}
        run: node scripts/sync-destination-intros.mjs
```

- [ ] **Step 2: images workflow**

Create `.github/workflows/sync-destination-images.yml` with this exact content:

```yaml
name: sync-destination-images

# detailImage2 적재 — destination_images row 없는 destination만 처리
# KST 03:00 (UTC 18:00) 매일 실행. 수동 실행도 가능.

on:
  schedule:
    - cron: "0 18 * * *"
  workflow_dispatch:

jobs:
  backfill:
    runs-on: ubuntu-latest
    timeout-minutes: 350

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run backfill
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          PUBLIC_DATA_API_KEY: ${{ secrets.PUBLIC_DATA_API_KEY }}
        run: node scripts/sync-destination-images.mjs
```

- [ ] **Step 3: YAML sanity**

```bash
node -e "
const yaml = require('fs').readFileSync('.github/workflows/sync-destination-intros.yml','utf8');
console.log('intros cron:', yaml.match(/cron:.*$/m)[0]);
const y2 = require('fs').readFileSync('.github/workflows/sync-destination-images.yml','utf8');
console.log('images cron:', y2.match(/cron:.*$/m)[0]);
"
```
Expected:
- `intros cron: cron: "0 17 * * *"`
- `images cron: cron: "0 18 * * *"`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/sync-destination-intros.yml .github/workflows/sync-destination-images.yml
git commit -m "$(cat <<'EOF'
ci: destination intros/images 백필 cron 추가

KST 02:00 (intros) + 03:00 (images) 매일 자동 실행.
기존 sync-destination-details.yml은 PR3 cleanup까지 보존.

운영자 작업: GitHub Secrets에 이미 등록된 NEXT_PUBLIC_SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY, PUBLIC_DATA_API_KEY 그대로 사용됨.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 종합 검증

**Files:** 없음 (verification only)

### Steps

- [ ] **Step 1: 새 파일 모두 존재 확인**

```bash
ls supabase/migrations/040_destination_intros_images.sql \
   supabase/migrations/041_get_nearby_tour_items.sql \
   scripts/sync-destination-intros.mjs \
   scripts/sync-destination-images.mjs \
   .github/workflows/sync-destination-intros.yml \
   .github/workflows/sync-destination-images.yml
```
Expected: 모든 파일 존재.

- [ ] **Step 2: 페이지 코드 미수정 확인**

```bash
git diff main..HEAD --stat | grep -E "^ src/" | head -5
```
Expected: 출력 없음 (src/ 변경 0건 — backward compatible 확인).

- [ ] **Step 3: 커밋 로그**

```bash
git log --oneline main..HEAD
```
Expected: 5개 commit (Task 1~5).

- [ ] **Step 4: 운영자 runbook 메모**

PR 머지 후 운영자가 수행해야 할 작업:

1. **마이그레이션 적용**:
   ```bash
   npx supabase db push
   ```
   또는 콘솔에서 040, 041 직접 실행.

2. **선택: 기존 jsonb 데이터를 신 테이블로 1회 이관** (외부 API 호출 절감용):
   ```sql
   -- intros 이관
   insert into destination_intros (content_id, content_type_id, common_fields, extras, synced_at)
   select 
     content_id, 
     content_type_id,
     jsonb_strip_nulls(intro_data - 'firstmenu' - 'opentimefood' - 'reservationfood' - 'smoking' - 'packing' - 'lcnsno' - 'kidsfacility' - 'discountinfofood' - 'scaleleports' - 'scalelodging' - 'roomtype' - 'roomcount' - 'subfacility' - 'foodplace' - 'pickup' - 'goodstay' - 'benikia' - 'hanok' - 'sauna' - 'cooking' - 'beauty' - 'beverage' - 'karaoke' - 'barbecue' - 'fitness' - 'publicbath' - 'publicpc' - 'seminar' - 'sports') as common_fields,
     jsonb_build_object(  -- extras: 위 common_fields에 안 들어간 모든 키
       'firstmenu', intro_data -> 'firstmenu',
       'opentimefood', intro_data -> 'opentimefood'
       -- 필요 시 더 추가
     ) as extras,
     now()
   from destinations
   where intro_data is not null and intro_data != '{}'::jsonb;

   -- images 이관: jsonb 배열 unnest
   insert into destination_images (content_id, origin_url, image_name, serial_num, synced_at)
   select
     d.content_id,
     img ->> 'originimgurl' as origin_url,
     img ->> 'imgname' as image_name,
     (img ->> 'serialnum')::int as serial_num,
     now()
   from destinations d, jsonb_array_elements(d.image_data) img
   where d.image_data is not null and jsonb_array_length(d.image_data) > 0;
   ```

3. **신규 sync 스크립트 첫 실행** (운영자가 수동 또는 GH Actions workflow_dispatch):
   ```bash
   node --env-file=.env.local scripts/sync-destination-intros.mjs
   node --env-file=.env.local scripts/sync-destination-images.mjs
   ```

4. **검증 SQL**:
   ```sql
   select count(*) from destination_intros;  -- destinations 수와 비슷해야 함
   select count(*) from destination_images;  -- destinations 수보다 많을 수도 (1:N)
   select * from get_nearby_tour_items(37.5665, 126.9780, null, array['12','15'], 10000, 5);
   ```

- [ ] **Step 5: 페이지 동작 영향 0 확인**

```bash
git grep -E "destination_intros|destination_images" src/ 2>&1 | head -5
```
Expected: 출력 없음 (src/ 어디에서도 신 테이블 참조 안 함 — PR2에서 처리).

PR1 머지 후에도 페이지는 여전히 `destinations.intro_data` / `image_data` jsonb를 읽음.

검증 모두 통과하면 plan 완료.

---

## Self-Review

### Spec coverage
| Spec section | 대응 task |
|---|---|
| §3.1 `destination_intros` | Task 1 |
| §3.2 `destination_images` | Task 1 |
| §3.3 `get_nearby_tour_items` RPC | Task 2 |
| §4.3 `sync-destination-intros.mjs` | Task 3 |
| §4.4 `sync-destination-images.mjs` | Task 4 |
| §4.5 GH Actions cron 분리 | Task 5 (두 워크플로) |
| §5 페이지/컴포넌트 변경 | **PR2 plan으로 분리** |
| §6 PR1 스코프 | 본 plan 전체 |

### Placeholder scan
- "TBD"/"implement later" 없음
- 모든 step에 구체적 SQL/JS/명령어
- "Similar to Task N" 없음

### Type consistency
- 테이블 컬럼명: `content_id`, `content_type_id`, `common_fields`, `extras`, `synced_at`, `origin_url`, `image_name`, `serial_num` — 마이그레이션, sync, runbook 모두 일치
- RPC 파라미터: `p_lat`, `p_lng`, `p_exclude`, `p_types`, `radius_meters`, `result_limit` — 정의와 GRANT 시그니처 일치
- workflow 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_DATA_API_KEY` — sync 스크립트 + 두 워크플로 동일

---

## 알려진 한계

- **빈 detailImage2 응답 처리**: 빈 응답이면 `destination_images`에 row 0건이라 다음 실행 시 또 시도됨. 진짜 "이미지 없음" sentinel을 위해 별도 컬럼/테이블 필요할 수 있으나, TourAPI 한도 영향 작아 단순화.
- **이관 SQL의 extras 필드 화이트리스트**: runbook의 jsonb 이관 SQL은 common_fields 키 ~30개만 명시. 실제 jsonb 키가 더 많을 수 있으므로 운영자가 한 row 샘플 확인 후 조정.
- **테스트 프레임워크 부재**: 단위 테스트 없음. `node --check` + Supabase SQL 검증으로 대체.
- **timeout-minutes: 350**: GH Actions free tier 한도 6h 내. 백필이 그보다 오래 걸리면 다음날 resume.
