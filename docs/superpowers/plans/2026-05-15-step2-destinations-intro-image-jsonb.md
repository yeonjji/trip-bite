# Step 2 — destinations에 intro/image jsonb 컬럼 + sync 확장 + 페이지 외부 호출 제거 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `destinations` 테이블에 `intro_data` / `image_data` jsonb 컬럼을 추가하고 sync 스크립트로 백필한 뒤, 페이지가 매 요청마다 호출하던 TourAPI `detailIntro` / `detailImage`를 DB-first 패턴으로 교체한다 (travel + restaurants 동시).

**Architecture:** 마이그레이션으로 jsonb 컬럼 추가 → 별도 백필 스크립트가 row별로 detailIntro/detailImage를 채움 (resume 지원, throttled) → 데이터 함수는 DB lookup → miss 시 external fallback + upsert 패턴. 이후 모든 요청은 DB에서 즉시 응답.

**Tech Stack:** Supabase PostgreSQL (jsonb), Node.js ESM (sync script), Next.js 15 App Router (data 함수 + page), TypeScript.

**Spec reference:** `docs/superpowers/specs/2026-05-15-db-first-external-api-audit.md` (Category A 잔여 항목 + 공통 패턴 §4)

**Verification:** 프로젝트에 테스트 프레임워크 미설정. 각 task는 `pnpm exec tsc --noEmit` + `pnpm exec eslint <files>` + 최종 `pnpm build`로 검증. 마이그레이션은 SQL 문법 검사 (`supabase db lint` 옵션 없으면 manual review).

---

## File Structure

### 신규 파일
| 파일 | 역할 |
|---|---|
| `supabase/migrations/038_destinations_intro_image.sql` | `intro_data` (jsonb), `image_data` (jsonb) 컬럼 추가 |
| `scripts/sync-destination-details.mjs` | row별로 `detailIntro2` + `detailImage2` 호출해 컬럼 백필. resume 지원 (이미 채워진 row 건너뜀) |

### 수정 파일
| 파일 | 변경 |
|---|---|
| `src/types/database.ts` | `Destination` 인터페이스에 `intro_data?` / `image_data?` 추가 |
| `src/lib/data/destinations.ts` | `getDestinationIntro` 본문을 DB-first 패턴으로 교체 (`tourApi.detailIntro` 직접 호출 → DB lookup → miss 시 fetch + upsert). 새 함수 `getDestinationImagesFromDb` 추가 |
| `src/lib/data/restaurants.ts` | `getRestaurantDetail`에서 `tourApi.detailIntro` / `detailImage` 호출 제거, `getDestinationIntro` / `getDestinationImagesFromDb` 재사용 |
| `src/app/[locale]/restaurants/[id]/page.tsx` | 동일 (호출 사이트 변경 없음 — getRestaurantDetail 내부 구현만 바뀜) |

### 비목표 (별도 plan/PR)
- `restaurants/[id]/page.tsx`의 `export const dynamic = "force-dynamic"` 정리 (이 plan 직후 별도 작은 PR로 처리 권장)
- `nearby_tour_cache`, `wiki_summaries`, `kakao_place_cache`, `naver_search_cache` 등 새 테이블 (Step 3/4 plan)
- `cached_at` 만료 기반 자동 background refresh (현재는 sync 스크립트 주기적 실행이 source of truth)

---

## Task 1: 마이그레이션 — destinations에 intro_data / image_data jsonb 컬럼 추가

**Files:**
- Create: `supabase/migrations/038_destinations_intro_image.sql`

**Context:**
TourAPI `detailIntro2`는 content_type_id별 응답 스키마가 다름 (travel = `TourSpotDetail` with usetime/parking/heritage 등, 음식점 = `RestaurantDetail` with firstmenu/opentimefood 등). jsonb로 통일 저장하면 스키마 변동에 강건하고 listing 쿼리에 영향 없음(toast로 분리 저장됨). `detailImage2`는 `TourImage[]` 배열이므로 마찬가지 jsonb.

- [ ] **Step 1: 다음 마이그레이션 번호 확인**

Run: `ls supabase/migrations/ | tail -5`
Expected: `037_expand_shop_categories.sql`이 마지막. 다음 번호 = `038`.

- [ ] **Step 2: 마이그레이션 파일 작성**

Create `supabase/migrations/038_destinations_intro_image.sql` with this exact content:

```sql
-- Step 2: destinations에 TourAPI detailIntro / detailImage 응답 저장 컬럼 추가
-- 페이지가 매 요청마다 외부 호출하지 않도록 DB-first 전환.

alter table public.destinations
  add column if not exists intro_data jsonb,
  add column if not exists image_data jsonb;

comment on column public.destinations.intro_data is
  'TourAPI detailIntro2 응답 (content_type_id별 스키마 상이). null이면 미백필 상태.';
comment on column public.destinations.image_data is
  'TourAPI detailImage2 응답 (TourImage[]). null이면 미백필, [] 이면 이미지 없음으로 백필됨.';
```

- [ ] **Step 3: SQL 문법 sanity check (해당 도구 있을 때만)**

Run: `head -20 supabase/migrations/038_destinations_intro_image.sql`
확인: `alter table ... add column if not exists ... jsonb` 두 줄과 `comment on column` 두 줄.

이 마이그레이션은 idempotent (`if not exists`). 이미 적용된 환경에서도 안전.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/038_destinations_intro_image.sql
git commit -m "$(cat <<'EOF'
feat: destinations에 intro_data / image_data jsonb 컬럼 추가

TourAPI detailIntro2 / detailImage2 응답을 캐싱하기 위한 컬럼.
백필은 sync-destination-details.mjs (다음 commit)에서 수행.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: TypeScript 타입에 새 컬럼 추가

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: 현재 `Destination` 인터페이스 확인**

Run: `sed -n '59,82p' src/types/database.ts`
Expected: 인터페이스 본문이 `id`, `content_id`, ..., `cached_at`, `created_at`, `updated_at`로 끝남.

- [ ] **Step 2: 두 필드 추가**

`src/types/database.ts`에서 다음을 찾기:

```ts
  rating_avg: number;
  rating_count: number;
  cached_at: string;
  created_at: string;
  updated_at: string;
}
```

교체:

```ts
  rating_avg: number;
  rating_count: number;
  cached_at: string;
  // Step 2: detailIntro2 / detailImage2 응답 캐시 (null이면 미백필)
  intro_data?: Record<string, unknown> | null;
  image_data?: Array<Record<string, unknown>> | null;
  created_at: string;
  updated_at: string;
}
```

`Record<string, unknown>`를 쓰는 이유: content_type_id별 스키마가 다르므로 강제 타입 대신 광범위 타입을 두고, 호출 사이트에서 `as TourSpotDetail` / `as RestaurantDetail` 캐스팅으로 좁힌다.

- [ ] **Step 3: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: 커밋**

```bash
git add src/types/database.ts
git commit -m "$(cat <<'EOF'
feat: Destination 타입에 intro_data / image_data 필드 추가

038 마이그레이션에 대응. content_type_id별 스키마가 달라
Record<string, unknown>으로 광범위 타입 지정 후 호출 사이트에서 캐스팅.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 백필 스크립트 작성

**Files:**
- Create: `scripts/sync-destination-details.mjs`

**Context:**
- 기존 `sync-destinations.mjs`가 `areaBasedList2`로 base row를 채움. 이 스크립트는 그 이후 단계로, row별로 `detailIntro2` + `detailImage2`를 호출해 `intro_data` / `image_data`를 채움.
- **추가 외부 호출량 = row 수 × 2**. 수만 row면 5만+ 호출. TourAPI 일일 한도 고려해 resume + throttle 필수.
- **Resume 정책**: `intro_data is null`인 row만 처리. 한 번 채워진 row는 재실행 시 자동 skip.
- **throttle**: 기존 sync-destinations.mjs와 동일하게 page 사이 200ms, 호출 사이 100ms sleep.
- **batch 크기**: 한 row씩 처리. parallel은 rate limit 위험.

- [ ] **Step 1: 스크립트 작성**

Create `scripts/sync-destination-details.mjs` with this exact content:

```js
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
const BATCH_SIZE = 100;
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
  if (!res.ok) return null;
  const data = await res.json();
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
  if (!res.ok) return [];
  const data = await res.json();
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

async function fetchPendingBatch(offset) {
  const { data, error } = await supabase
    .from("destinations")
    .select("content_id, content_type_id")
    .is("intro_data", null)
    .order("content_id")
    .range(offset, offset + BATCH_SIZE - 1);
  if (error) throw error;
  return data ?? [];
}

async function main() {
  console.log("🗺️  destinations intro/image 백필 시작...\n");
  let totalProcessed = 0;
  let totalErrors = 0;

  while (true) {
    const batch = await fetchPendingBatch(0);
    if (batch.length === 0) break;

    for (const row of batch) {
      try {
        await processRow(row);
        totalProcessed++;
        if (totalProcessed % 50 === 0) {
          console.log(`  진행: ${totalProcessed}건 완료`);
        }
      } catch (err) {
        totalErrors++;
        console.error(`  ❌ ${row.content_id}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, ROW_SLEEP_MS));
    }
  }

  console.log(`\n🎉 완료! 처리 ${totalProcessed}건 / 실패 ${totalErrors}건`);
}

main().catch(console.error);
```

- [ ] **Step 2: 정적 검사 (Node syntax)**

Run: `node --check scripts/sync-destination-details.mjs`
Expected: no output (exit 0). syntax error 없음.

- [ ] **Step 3: 실행 가이드 README 한 줄 추가 (있다면)**

Run: `grep -n "sync-" scripts/README.md 2>/dev/null || echo "no scripts/README.md"`
- 만약 `scripts/README.md`가 있으면 다른 sync 스크립트와 같은 형태로 한 줄 추가
- 없으면 이 step 스킵

- [ ] **Step 4: 커밋**

```bash
git add scripts/sync-destination-details.mjs
git commit -m "$(cat <<'EOF'
feat: sync-destination-details.mjs — intro_data/image_data 백필

destinations.intro_data IS NULL인 row만 처리 (resume 지원).
row 사이 150ms sleep으로 TourAPI 일일 한도 보호.

실행: node --env-file=.env.local scripts/sync-destination-details.mjs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 데이터 함수 — DB-first + external fallback + upsert 패턴

**Files:**
- Modify: `src/lib/data/destinations.ts`

**Context:**
현재 `getDestinationIntro(contentId, contentTypeId)`는 매번 `tourApi.detailIntro`를 호출함. DB-first 패턴으로 교체:
1. `destinations.intro_data` 조회
2. 있으면 그대로 반환
3. 없으면 외부 호출 + DB upsert (cold cache 대응)

추가로 `getDestinationImagesFromDb(contentId)`를 신설해 음식점 페이지에서 사용.

- [ ] **Step 1: 현재 `getDestinationIntro` 위치 확인**

Run: `grep -n "export async function getDestinationIntro" src/lib/data/destinations.ts`
Expected: 1 line (현재는 외부 호출만 하는 단순 함수).

- [ ] **Step 2: `getDestinationIntro` 본문 교체**

`src/lib/data/destinations.ts`에서 다음 정확한 블록을 찾기:

```ts
/** Streaming 전용: TourAPI detailIntro (운영시간/주차/체험안내/세계유산 등) */
export async function getDestinationIntro(
  contentId: string,
  contentTypeId: string = "12",
): Promise<TourSpotDetail | null> {
  try {
    const res = await tourApi.detailIntro(contentId, contentTypeId);
    const items = res.response.body.items;
    return items !== "" && items.item.length > 0 ? (items.item[0] as TourSpotDetail) : null;
  } catch {
    return null;
  }
}
```

교체:

```ts
/**
 * Streaming 전용: detailIntro 데이터 가져오기 (운영시간/주차/체험안내/세계유산 등).
 *
 * DB-first 패턴: destinations.intro_data 조회 → miss 시 외부 호출 + upsert.
 * 백필 완료 후에는 항상 DB hit. cold cache 대응으로 fallback 유지.
 */
export async function getDestinationIntro(
  contentId: string,
  contentTypeId: string = "12",
): Promise<TourSpotDetail | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("destinations")
    .select("intro_data")
    .eq("content_id", contentId)
    .maybeSingle();

  // DB hit: 빈 객체({})는 "외부에서도 못 가져왔던 row"라는 마커
  if (row?.intro_data && Object.keys(row.intro_data).length > 0) {
    return row.intro_data as unknown as TourSpotDetail;
  }

  // DB miss: 외부 호출 + upsert
  try {
    const res = await tourApi.detailIntro(contentId, contentTypeId);
    const items = res.response.body.items;
    const intro =
      items !== "" && items.item.length > 0 ? (items.item[0] as TourSpotDetail) : null;

    await supabase
      .from("destinations")
      .update({ intro_data: intro ?? {} })
      .eq("content_id", contentId);

    return intro;
  } catch {
    return null;
  }
}

/**
 * 음식점/여행지 상세 이미지 갤러리 데이터.
 *
 * DB-first 패턴: destinations.image_data 조회 → miss 시 외부 호출 + upsert.
 */
export async function getDestinationImagesFromDb(
  contentId: string,
): Promise<TourImage[]> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("destinations")
    .select("image_data")
    .eq("content_id", contentId)
    .maybeSingle();

  if (Array.isArray(row?.image_data)) {
    return row.image_data as unknown as TourImage[];
  }

  // DB miss: 외부 호출 + upsert
  try {
    const res = await tourApi.detailImage(contentId);
    const items = res.response.body.items;
    const images: TourImage[] = items !== "" ? items.item : [];

    await supabase
      .from("destinations")
      .update({ image_data: images })
      .eq("content_id", contentId);

    return images;
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: `TourImage` import 복원**

이전 PR(#37)에서 `TourImage` import를 제거했음. 새 함수가 사용하므로 다시 추가.

`src/lib/data/destinations.ts` 상단에서 다음을 찾기:
```ts
import type { TourDetailCommon, TourSpotDetail } from "@/types/tour-api";
```

교체:
```ts
import type { TourDetailCommon, TourSpotDetail, TourImage } from "@/types/tour-api";
```

- [ ] **Step 4: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Lint**

Run: `pnpm exec eslint src/lib/data/destinations.ts`
Expected: no output.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/data/destinations.ts
git commit -m "$(cat <<'EOF'
feat: getDestinationIntro DB-first 전환 + getDestinationImagesFromDb 신설

destinations.intro_data / image_data 컬럼 조회 → miss 시 외부 호출
+ upsert. 백필 완료 후에는 외부 호출 0, cold cache 자동 워밍.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 음식점 — `getRestaurantDetail`에서 외부 호출 제거

**Files:**
- Modify: `src/lib/data/restaurants.ts`

**Context:**
현재 `getRestaurantDetail`은 `tourApi.detailIntro(contentId, "39")` + `tourApi.detailImage(contentId)`를 직접 호출. Task 4에서 추가한 DB-first 함수로 교체.

- [ ] **Step 1: 현재 본문 확인**

Run: `sed -n '69,135p' src/lib/data/restaurants.ts`
Expected: PR #38 후의 모습 — `Promise.allSettled([tourApi.detailIntro, tourApi.detailImage])` + 매핑 + `return { destination, detail, intro, images }`.

- [ ] **Step 2: 본문 교체**

`src/lib/data/restaurants.ts`에서 다음 정확한 블록을 찾기:

```ts
  const [introRes, imagesRes] = await Promise.allSettled([
    tourApi.detailIntro(contentId, "39"),
    tourApi.detailImage(contentId),
  ]);

  const intro =
    introRes.status === "fulfilled"
      ? (introRes.value.response.body.items !== ""
          ? (introRes.value.response.body.items.item[0] as RestaurantDetail)
          : null) ?? null
      : null;

  const images =
    imagesRes.status === "fulfilled" && imagesRes.value.response.body.items !== ""
      ? imagesRes.value.response.body.items.item
      : [];

  return {
    destination: dest,
    detail,
    intro,
    images,
  };
```

교체:

```ts
  // DB-first 패턴 (Step 2 plan): intro/images 모두 destinations 테이블 jsonb 컬럼에서 읽음.
  // 백필 안 된 row는 함수 내부에서 외부 호출 + upsert.
  const [introData, imageData] = await Promise.all([
    getDestinationIntro(contentId, "39"),
    getDestinationImagesFromDb(contentId),
  ]);

  // RestaurantDetail은 TourSpotDetail과 다른 음식점 전용 스키마. jsonb는 광범위
  // 타입이라 캐스팅으로 좁힌다. 빈 객체는 데이터 없음으로 처리.
  const intro =
    introData && Object.keys(introData).length > 0
      ? (introData as unknown as RestaurantDetail)
      : null;

  return {
    destination: dest,
    detail,
    intro,
    images: imageData,
  };
```

- [ ] **Step 3: import 추가**

`src/lib/data/restaurants.ts` 상단에서 기존 imports 확인:

```bash
sed -n '1,10p' src/lib/data/restaurants.ts
```

다음을 찾기 (위치는 다를 수 있음):
```ts
import { tourApi } from "@/lib/api/tour-api";
```

같은 import 블록에 다음 라인 추가:
```ts
import { getDestinationIntro, getDestinationImagesFromDb } from "./destinations";
```

`tourApi` import는 다른 함수 (`getRestaurants`, `getNearbyRestaurants`)에서 여전히 사용되므로 **유지**. 확인:
```bash
grep -n "tourApi" src/lib/data/restaurants.ts
```
Expected: 2개 이상 hit (한 곳은 import, 나머지는 다른 함수에서 사용).

만약 grep 결과 import 1줄만 남으면 (= tourApi가 더 이상 쓰이지 않으면) import 라인 제거. 그렇지 않으면 유지.

- [ ] **Step 4: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Lint**

Run: `pnpm exec eslint src/lib/data/restaurants.ts`
Expected: no output.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/data/restaurants.ts
git commit -m "$(cat <<'EOF'
perf: getRestaurantDetail intro/images도 DB-first로 전환

destinations.intro_data / image_data (음식점은 content_type_id='39')
컬럼을 활용. 외부 detailIntro/detailImage 호출 제거 — DB miss 시에만
fallback (Task 4의 getDestinationIntro/getDestinationImagesFromDb 내부).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 종합 검증 + 백필 실행 가이드

**Files:** 없음 (verification + runbook)

- [ ] **Step 1: 전체 type check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: 변경된 파일 lint**

Run:
```bash
pnpm exec eslint \
  src/lib/data/destinations.ts \
  src/lib/data/restaurants.ts \
  src/types/database.ts
```
Expected: no output.

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: exit 0. 모든 라우트 빌드 성공.

- [ ] **Step 4: 회귀 grep**

Run: `grep -rn "tourApi\.detailIntro\|tourApi\.detailImage" src/lib/data/`
Expected (이 plan 후의 상태):
- `src/lib/data/destinations.ts:<line>: const res = await tourApi.detailIntro(...)` — `getDestinationIntro` 내부의 fallback 경로
- `src/lib/data/destinations.ts:<line>: const res = await tourApi.detailImage(...)` — `getDestinationImagesFromDb` 내부의 fallback 경로

`restaurants.ts`나 다른 파일에서는 더 이상 나타나면 안 됨. 만약 나타나면 해당 파일을 fix.

- [ ] **Step 5: 커밋 로그 확인**

Run: `git log --oneline main..HEAD`
Expected: 정확히 5개 commit (Task 1 마이그레이션, Task 2 타입, Task 3 sync, Task 4 데이터함수, Task 5 음식점).

- [ ] **Step 6: 백필 실행 가이드 (운영자가 직접 수행)**

이 plan 자체는 백필을 실행하지 않음. PR 머지 후 운영자가 다음 명령 실행:

```bash
# Supabase 마이그레이션 적용 (CLI 사용 시)
supabase db push

# 또는 Supabase 콘솔에서 038 마이그레이션 직접 실행

# 백필 (별도 터미널에서 시간 두고 실행)
node --env-file=.env.local scripts/sync-destination-details.mjs
```

**예상 소요 시간**: row 수 × (150ms sleep + ~500ms API 응답). 1만 row면 약 2시간. 일일 한도 초과 시 중단 후 재실행하면 자동 resume.

**중단 후 재실행**: `intro_data IS NULL`인 row만 처리하므로 안전.

검증이 모두 통과하면 plan 완료.

---

## Self-Review

### Spec coverage
| Spec section | 대응 task |
|---|---|
| Category A: `destinations.ts:268-269` `tourApi.detailIntro/Image` | Task 1 (컬럼) + Task 3 (백필) + Task 4 (DB-first 함수) |
| Category A: `restaurants.ts:90-91` `tourApi.detailIntro/Image` | Task 5 (DB-first 함수 재사용) |
| 공통 패턴 §4 "DB-First → External-Fallback → Upsert-on-Miss" | Task 4의 `getDestinationIntro` / `getDestinationImagesFromDb` 본문 |
| 위험요소: jsonb 추가 시 listing row 크기 증가 | Task 1의 마이그레이션 jsonb 컬럼은 toast 분리 저장, listing select 명시 패턴 유지 |
| 위험요소: 백필 시 외부 API rate limit | Task 3의 150ms throttle + resume 정책 |

Step 2 spec 범위 모두 cover. Step 3 (Wiki/Kakao/Transit 캐시)는 별도 plan 예정.

### Placeholder scan
- 모든 step에 구체적 SQL/JS/TS 코드 또는 명령어 포함
- "TBD"/"implement later" 없음
- "Similar to Task N" 없음 (Task 5는 Task 4의 함수를 재사용하지만 호출 코드 전문 명시)

### Type consistency
- `Destination.intro_data?: Record<string, unknown> | null` — Task 2에서 정의, Task 4의 select 결과에서 사용
- `Destination.image_data?: Array<Record<string, unknown>> | null` — Task 2에서 정의, Task 4의 select 결과에서 사용
- `getDestinationIntro(contentId, contentTypeId?)` 시그니처는 Task 4 정의와 Task 5 호출 일치
- `getDestinationImagesFromDb(contentId)` 시그니처 일치
- `TourSpotDetail` (travel) / `RestaurantDetail` (음식점) 캐스팅은 jsonb 광범위 타입에서 좁히는 패턴으로 일관

---

## 알려진 한계

- **백필 완료 전** 페이지가 외부 호출 fallback을 사용 → 첫 hit 시 응답이 느릴 수 있음. 대신 자동 워밍되어 다음 hit부터 빠름.
- **백필 시 외부 호출량 폭증** — 신규 환경 또는 row 대량 추가 시 TourAPI 일일 한도 주의. throttle은 보호 수단이지만 한도 자체를 줄이지는 못함. 한도 초과 시 hardware reset(다음날 재실행)으로 복구 가능.
- **content_type별 스키마 차이** — jsonb는 광범위 타입이라 런타임 캐스팅 실패 시 잘못된 필드 접근 가능성. 호출 사이트에서 optional chaining 사용 권장.
- **음식점 페이지 `force-dynamic`** — 이 plan에서 다루지 않음. 별도 후속 PR에서 `revalidate = 3600`으로 교체 권장 (#35 PR 패턴).
- **테스트 프레임워크 부재** — 단위 테스트 작성 안 함. tsc + eslint + 빌드 + 회귀 grep + 백필 1회 실행으로 검증.
