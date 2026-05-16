# PR2 — 페이지/컴포넌트 DB-only 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PR1에서 만든 `destination_intros` / `destination_images` 테이블 + `get_nearby_tour_items` RPC를 페이지 코드에서 사용하도록 전환한다. NearbyTourSection의 외부 `tourApi.locationBasedList` 호출이 완전 제거된다.

**Architecture:** 세 데이터 함수(`getDestinationIntro`, `getDestinationImagesFromDb`, `getNearbyTourRecommendations*`)의 시그니처는 유지하고 내부 구현만 신 테이블/RPC 호출로 교체. 호출처 변경 없음. `tourApi.locationBasedList`가 호출처 0이 되면 제거.

**Tech Stack:** Next.js 15 App Router, Supabase JS client (REST/RPC).

**Spec reference:** `docs/superpowers/specs/2026-05-16-tourapi-master-tables-design.md` §5

**Verification:** 프로젝트 테스트 프레임워크 미설정. 각 task는 `pnpm exec tsc --noEmit` + `pnpm exec eslint <files>` + 최종 `pnpm build`로 검증. 회귀 grep으로 `tourApi.locationBasedList` 호출처 0 확인.

---

## File Structure

### 수정 파일
| 파일 | 변경 |
|---|---|
| `src/lib/data/destinations.ts` | `getDestinationIntro` 본문: `destinations.intro_data` jsonb → `destination_intros` 테이블 SELECT (common_fields + extras spread). `getDestinationImagesFromDb` 본문: `destinations.image_data` jsonb → `destination_images` 테이블 SELECT |
| `src/lib/data/nearby-tour-recommendations.ts` | `getNearbyTourItems` / `getNearbyTourRecommendations` / `getNearbyTourRecommendationsCached` 본문: `tourApi.locationBasedList` → `supabase.rpc('get_nearby_tour_items')` |
| `src/lib/api/tour-api.ts` | `locationBasedList` 함수 제거 (호출처 0 확인 후) |

### 호출처 (시그니처 유지로 영향 없음)
- `getNearbyTourRecommendations`: 6 페이지 + 2 컴포넌트
- `getDestinationIntro`: IntroSection
- `getDestinationImagesFromDb`: restaurants.ts(getRestaurantDetail)
- 모두 props/return shape 동일 → 수정 불필요

### 비목표
- jsonb 컬럼 drop은 PR3
- `tour-api.ts`의 `detailIntro` / `detailImage` 호출은 sync 스크립트에서 여전히 사용 — 제거 불가
- `getNearbyFoodItems`은 `getNearbyTourItems` 사용 → 자동으로 신 RPC 호출 (별도 변경 없음)

---

## Task 1: `getDestinationIntro` 본문 교체

**Files:**
- Modify: `src/lib/data/destinations.ts`

**Context:**
현재 `destinations.intro_data` jsonb 컬럼을 직접 조회. PR1에서 추가한 `destination_intros` 테이블의 `common_fields` + `extras` 를 spread해서 반환한다. 시그니처 `getDestinationIntro(contentId: string): Promise<TourSpotDetail | null>` 그대로.

### Steps

- [ ] **Step 1: 현재 함수 위치 확인**

```bash
grep -n "export async function getDestinationIntro" src/lib/data/destinations.ts
```
Expected: 1줄.

- [ ] **Step 2: 본문 교체**

다음 정확한 블록을 찾기:

```ts
/**
 * Streaming 전용: detailIntro 데이터 (운영시간/주차/체험안내/세계유산 등).
 *
 * DB-only. source of truth = sync-destination-details.mjs로 적재된 intro_data.
 * 백필 안 된 row는 null → IntroSection이 "정보없음"으로 처리.
 * 외부 호출 fallback 없음 (TourAPI 한도 영향 0).
 */
export async function getDestinationIntro(
  contentId: string,
): Promise<TourSpotDetail | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("destinations")
    .select("intro_data")
    .eq("content_id", contentId)
    .maybeSingle();

  return row?.intro_data != null ? (row.intro_data as unknown as TourSpotDetail) : null;
}
```

Replace with:

```ts
/**
 * Streaming 전용: detailIntro 데이터 (운영시간/주차/체험안내/세계유산 등).
 *
 * DB-only. source of truth = destination_intros 테이블 (sync-destination-intros.mjs).
 * 백필 안 된 row는 null → IntroSection이 "정보없음"으로 처리.
 */
export async function getDestinationIntro(
  contentId: string,
): Promise<TourSpotDetail | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("destination_intros")
    .select("common_fields, extras")
    .eq("content_id", contentId)
    .maybeSingle();

  if (!row) return null;

  const common = (row.common_fields ?? {}) as Record<string, unknown>;
  const extras = (row.extras ?? {}) as Record<string, unknown>;

  return { ...common, ...extras } as unknown as TourSpotDetail;
}
```

- [ ] **Step 3: 타입 체크**

```bash
pnpm exec tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Lint**

```bash
pnpm exec eslint src/lib/data/destinations.ts
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/destinations.ts
git commit -m "$(cat <<'EOF'
perf: getDestinationIntro를 destination_intros 테이블로 전환

기존 destinations.intro_data jsonb 조회 → destination_intros 테이블의
common_fields + extras spread. 시그니처 변경 없음.

source of truth = sync-destination-intros.mjs로 적재된 정규화 테이블.
jsonb 컬럼은 PR3에서 drop.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Self-review

1. `getDestinationIntro` 시그니처 `(contentId: string): Promise<TourSpotDetail | null>` 그대로.
2. `.from("destination_intros")` 호출, `.from("destinations")` 아님.
3. `common_fields` + `extras` 둘 다 spread.
4. `row` 가 null이면 null 반환.
5. tsc + eslint 통과.
6. 1개 새 commit.

---

## Task 2: `getDestinationImagesFromDb` 본문 교체

**Files:**
- Modify: `src/lib/data/destinations.ts`

**Context:**
현재 `destinations.image_data` jsonb 조회. `destination_images` 테이블에서 row 단위로 SELECT, `serial_num` 오름차순. 시그니처 `getDestinationImagesFromDb(contentId): Promise<TourImage[]>` 그대로.

### Steps

- [ ] **Step 1: 현재 함수 위치 확인**

```bash
grep -n "export async function getDestinationImagesFromDb" src/lib/data/destinations.ts
```

- [ ] **Step 2: 본문 교체**

다음 정확한 블록을 찾기:

```ts
/**
 * 상세 이미지 갤러리 데이터 (destinations 테이블 image_data 컬럼).
 *
 * DB-first 패턴: 조회 → miss 시 외부 호출 + upsert.
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

  return Array.isArray(row?.image_data) ? (row.image_data as unknown as TourImage[]) : [];
}
```

Replace with:

```ts
/**
 * 상세 이미지 갤러리 데이터 (destination_images 테이블 1:N).
 *
 * DB-only. source of truth = sync-destination-images.mjs.
 * serial_num 오름차순.
 */
export async function getDestinationImagesFromDb(
  contentId: string,
): Promise<TourImage[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("destination_images")
    .select("origin_url, image_name, serial_num")
    .eq("content_id", contentId)
    .order("serial_num", { ascending: true });

  return (data ?? []).map((r) => ({
    originimgurl: r.origin_url,
    imgname: r.image_name ?? "",
    serialnum: r.serial_num != null ? String(r.serial_num) : "",
    smallimageurl: r.origin_url,
    cpyrhtDivCd: "",
  } as unknown as TourImage));
}
```

**중요**: `TourImage` 타입은 `serialnum: string`, `smallimageurl: string`, `cpyrhtDivCd: string` 등을 요구할 수 있음 — 타입 파일 확인 후 모든 필수 필드 채움.

- [ ] **Step 3: TourImage 타입 확인**

```bash
grep -A 10 "interface TourImage\|type TourImage" src/types/tour-api.ts
```
Expected: 필드 목록 (originimgurl, imgname, serialnum, smallimageurl, cpyrhtDivCd 등).

만약 위 Step 2의 mapping이 타입에서 요구하는 필드를 모두 채우지 못하면 cast `as unknown as TourImage`로 좁히되, 누락 가능한 optional 필드는 빈 문자열/null로 채움.

- [ ] **Step 4: 타입 체크**

```bash
pnpm exec tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Lint**

```bash
pnpm exec eslint src/lib/data/destinations.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/destinations.ts
git commit -m "$(cat <<'EOF'
perf: getDestinationImagesFromDb를 destination_images 테이블로 전환

기존 destinations.image_data jsonb array → destination_images 1:N 테이블.
serial_num 오름차순 정렬.

source of truth = sync-destination-images.mjs로 적재된 정규화 테이블.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Self-review

1. `.from("destination_images")` 호출.
2. `order("serial_num", { ascending: true })`.
3. Return type `TourImage[]` 유지.
4. 시그니처 변경 없음.
5. 1개 새 commit.

---

## Task 3: `getNearbyTourItems` / `getNearbyTourRecommendations` 본문 교체 (RPC 사용)

**Files:**
- Modify: `src/lib/data/nearby-tour-recommendations.ts`

**Context:**
현재 `getNearbyTourItems`가 `tourApi.locationBasedList`를 type별로 한 번씩 호출 (총 N회). 신규: `supabase.rpc("get_nearby_tour_items", { p_types: [...] })`로 1회 호출하고 결과를 type별로 group.

`getNearbyTourRecommendations`의 시그니처는 그대로 유지. 내부 구현 통합 (개별 `getNearbyTourItems` 호출 → RPC 1회).

### Steps

- [ ] **Step 1: 현재 함수 구조 확인**

```bash
sed -n '93,165p' src/lib/data/nearby-tour-recommendations.ts
```

- [ ] **Step 2: type 매핑 헬퍼는 그대로 유지**

`CONTENT_TYPE_BY_NEARBY_TYPE`, `CAT3_BY_NEARBY_TYPE`, `NEARBY_TOUR_PLACEHOLDER_IMAGE` 상수 유지.

- [ ] **Step 3: `tourApi` import 제거 + supabase import 추가**

`src/lib/data/nearby-tour-recommendations.ts` 첫 줄을 찾기:

```ts
import { tourApi } from "@/lib/api/tour-api";
import { unstable_cache } from "next/cache";
import type { TourSpotBase } from "@/types/tour-api";
```

Replace with:

```ts
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
```

`TourSpotBase` import는 더 이상 필요 없음 (RPC는 typed row 직접 반환).

- [ ] **Step 4: `normalizeNearbyTourItem`은 keep, `getNearbyTourItems` 재구현**

`getNearbyTourItems` 함수 전체를 찾기 (Step 1에서 확인한 위치):

```ts
export async function getNearbyTourItems({
  lat,
  lng,
  type,
  excludeContentId,
  limit = 6,
  radiusMeters = DEFAULT_RADIUS_METERS,
}: {
  lat: number;
  lng: number;
  type: NearbyTourType;
  excludeContentId?: string | null;
  limit?: number;
  radiusMeters?: number;
}): Promise<NearbyTourItem[]> {
  try {
    const response = await tourApi.locationBasedList({
      mapX: lng,
      mapY: lat,
      radius: radiusMeters,
      contentTypeId: CONTENT_TYPE_BY_NEARBY_TYPE[type],
      cat3: CAT3_BY_NEARBY_TYPE[type],
      arrange: "E",
      pageNo: 1,
      numOfRows: FETCH_POOL_SIZE,
    });

    const rawItems = response.response.body.items === ""
      ? []
      : toArray(response.response.body.items.item);

    return rawItems
      .filter((item) => String(item.contentid) !== String(excludeContentId ?? ""))
      .filter((item) => item.firstimage || item.firstimage2)
      .map((item) => normalizeNearbyTourItem(item, type, { lat, lng }))
      .filter((item): item is NearbyTourItem => item !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  } catch (error) {
    console.error(`nearby ${type} fetch error:`, error instanceof Error ? error.message : error);
    return [];
  }
}
```

Replace with:

```ts
// RPC row shape (PR1 migration 041 RETURNS TABLE과 일치)
interface NearbyTourRpcRow {
  content_id: string;
  content_type_id: string;
  title: string;
  addr1: string;
  first_image: string | null;
  lat: number;
  lng: number;
  distance_km: number;
}

function rowToNearbyTourItem(row: NearbyTourRpcRow, type: NearbyTourType): NearbyTourItem {
  return {
    id: `${type}-${row.content_id}`,
    contentId: row.content_id,
    title: row.title,
    type,
    address: row.addr1,
    image: row.first_image || NEARBY_TOUR_PLACEHOLDER_IMAGE,
    lat: row.lat,
    lng: row.lng,
    distance: row.distance_km,
  };
}

function contentTypeIdToNearbyType(contentTypeId: string): NearbyTourType | null {
  switch (contentTypeId) {
    case "12":
      return "travel";
    case "15":
      return "festival";
    case "32":
      return "accommodation";
    case "39":
      return "restaurant"; // cafe는 cat3 필요 — RPC에 cat3 미지원, 동일 type 반환
    default:
      return null;
  }
}

export async function getNearbyTourItems({
  lat,
  lng,
  type,
  excludeContentId,
  limit = 6,
  radiusMeters = DEFAULT_RADIUS_METERS,
}: {
  lat: number;
  lng: number;
  type: NearbyTourType;
  excludeContentId?: string | null;
  limit?: number;
  radiusMeters?: number;
}): Promise<NearbyTourItem[]> {
  const supabase = await createClient();
  const contentTypeId = CONTENT_TYPE_BY_NEARBY_TYPE[type];

  const { data, error } = await supabase.rpc("get_nearby_tour_items", {
    p_lat: lat,
    p_lng: lng,
    p_exclude: excludeContentId ?? null,
    p_types: [contentTypeId],
    radius_meters: radiusMeters,
    result_limit: limit,
  });

  if (error) {
    console.error(`nearby ${type} RPC error:`, error.message);
    return [];
  }

  return ((data as NearbyTourRpcRow[]) ?? []).map((row) => rowToNearbyTourItem(row, type));
}
```

- [ ] **Step 5: `getNearbyTourRecommendations` 본문 — RPC 1회 통합 호출로 최적화**

다음 정확한 블록을 찾기:

```ts
export async function getNearbyTourRecommendations({
  lat,
  lng,
  excludeContentId,
  types = ["travel", "festival", "accommodation"],
  limitPerType = 6,
}: {
  lat: number;
  lng: number;
  excludeContentId?: string | null;
  types?: NearbyTourType[];
  limitPerType?: number;
}): Promise<NearbyTourRecommendations> {
  const entries = await Promise.all(
    types.map(async (type) => [
      type,
      await getNearbyTourItems({ lat, lng, type, excludeContentId, limit: limitPerType }),
    ] as const)
  );

  return {
    travel: entries.find(([type]) => type === "travel")?.[1] ?? [],
    festival: entries.find(([type]) => type === "festival")?.[1] ?? [],
    accommodation: entries.find(([type]) => type === "accommodation")?.[1] ?? [],
    restaurant: entries.find(([type]) => type === "restaurant")?.[1] ?? [],
    cafe: entries.find(([type]) => type === "cafe")?.[1] ?? [],
  };
}
```

Replace with:

```ts
export async function getNearbyTourRecommendations({
  lat,
  lng,
  excludeContentId,
  types = ["travel", "festival", "accommodation"],
  limitPerType = 6,
}: {
  lat: number;
  lng: number;
  excludeContentId?: string | null;
  types?: NearbyTourType[];
  limitPerType?: number;
}): Promise<NearbyTourRecommendations> {
  // type별 distinct content_type_id 모아 RPC 1회 호출
  // (cafe는 cat3 기반이라 RPC가 별도로 분리 못 함 — restaurant과 동일 응답에서 frontend가 표시 결정)
  const contentTypeIds = Array.from(
    new Set(types.map((t) => CONTENT_TYPE_BY_NEARBY_TYPE[t])),
  );

  const supabase = await createClient();
  // type 수만큼 result_limit 곱해서 충분히 가져오기 (그룹 후 type별 limit 적용)
  const { data, error } = await supabase.rpc("get_nearby_tour_items", {
    p_lat: lat,
    p_lng: lng,
    p_exclude: excludeContentId ?? null,
    p_types: contentTypeIds,
    radius_meters: DEFAULT_RADIUS_METERS,
    result_limit: limitPerType * contentTypeIds.length,
  });

  const empty: NearbyTourRecommendations = {
    travel: [], festival: [], accommodation: [], restaurant: [], cafe: [],
  };

  if (error) {
    console.error("getNearbyTourRecommendations RPC error:", error.message);
    return empty;
  }

  // type별 group + 각 type별 limit 적용
  const grouped: NearbyTourRecommendations = { ...empty };
  for (const row of ((data as NearbyTourRpcRow[]) ?? [])) {
    const nearbyType = contentTypeIdToNearbyType(row.content_type_id);
    if (!nearbyType || !types.includes(nearbyType)) continue;
    if (grouped[nearbyType].length >= limitPerType) continue;
    grouped[nearbyType].push(rowToNearbyTourItem(row, nearbyType));
  }
  return grouped;
}
```

- [ ] **Step 6: 미사용 헬퍼 정리**

`toArray`, `toNumber`, `normalizeNearbyTourItem`는 더 이상 사용 안 됨. 단 `calculateDistanceKm`는 다른 곳에서 import 될 수 있음 — 확인:

```bash
grep -n "calculateDistanceKm\|normalizeNearbyTourItem\|^function toArray\|^function toNumber" src/ -r
```

`calculateDistanceKm`이 다른 파일에서 import되면 keep, 아니면 제거. `normalizeNearbyTourItem`, `toArray`, `toNumber`는 같은 파일 내부에서만 쓰이고 새 구현에서 안 쓰므로 제거 가능.

다음 미사용 코드를 제거:

```ts
function toArray<T>(value: T[] | T | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeNearbyTourItem(
  item: TourSpotBase,
  type: NearbyTourType,
  origin: { lat: number; lng: number }
): NearbyTourItem | null {
  const lat = toNumber(item.mapy);
  const lng = toNumber(item.mapx);
  const contentId = item.contentid ? String(item.contentid) : "";
  const title = item.title?.trim() ?? "";

  if (!contentId || !title || lat === null || lng === null) return null;

  return {
    id: `${type}-${contentId}`,
    contentId,
    title,
    type,
    address: [item.addr1, item.addr2].filter(Boolean).join(" "),
    image: item.firstimage || item.firstimage2 || NEARBY_TOUR_PLACEHOLDER_IMAGE,
    lat,
    lng,
    distance: calculateDistanceKm(origin, { lat, lng }),
  };
}
```

(`calculateDistanceKm`은 외부 import 있으면 keep, 없으면 같이 제거. Step 6 grep 결과로 결정.)

`FETCH_POOL_SIZE` 상수도 미사용 → 제거.

- [ ] **Step 7: 타입 체크**

```bash
pnpm exec tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 8: Lint**

```bash
pnpm exec eslint src/lib/data/nearby-tour-recommendations.ts
```
Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add src/lib/data/nearby-tour-recommendations.ts
git commit -m "$(cat <<'EOF'
perf: getNearbyTourRecommendations를 get_nearby_tour_items RPC로 전환

기존 tourApi.locationBasedList ×3 호출 → PostGIS RPC 1회.
NearbyTourSection 외부 호출 0.

- RPC row shape에 맞춰 NearbyTourRpcRow 타입 + rowToNearbyTourItem 매퍼 신설
- type 수만큼 limitPerType 곱해 한 번에 가져온 뒤 type별 group + slice
- 미사용 헬퍼(toArray/toNumber/normalizeNearbyTourItem/FETCH_POOL_SIZE) 정리

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Self-review

1. `tourApi.locationBasedList` 호출 사라짐.
2. `supabase.rpc("get_nearby_tour_items", ...)` 사용.
3. `getNearbyTourItems`, `getNearbyTourRecommendations`, `getNearbyTourRecommendationsCached` 시그니처 그대로.
4. `getNearbyFoodItems`는 `getNearbyTourItems`를 호출하므로 자동 전환.
5. tsc + eslint 통과.
6. 1개 새 commit.

---

## Task 4: `tour-api.ts`에서 `locationBasedList` 제거

**Files:**
- Modify: `src/lib/api/tour-api.ts`

**Context:**
Task 3 후 `locationBasedList`는 호출처가 0. dead code 제거.

### Steps

- [ ] **Step 1: 호출처 0 확인**

```bash
git grep -n "locationBasedList\|tourApi\.locationBasedList" -- "src/" | grep -v "/tour-api.ts:"
```
Expected: 출력 없음 (모든 호출처 제거됨).

만약 다른 호출처가 남으면 STOP and report BLOCKED.

- [ ] **Step 2: 함수 제거**

`src/lib/api/tour-api.ts`에서 다음 정확한 블록을 찾기:

```ts
  // 위치 기반 관광정보 조회
  locationBasedList(params: TourApiListParams): Promise<ApiResponse<TourSpotBase>> {
    const searchParams = getCommonParams();
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.contentTypeId) searchParams.set("contentTypeId", params.contentTypeId);
    if (params.arrange) searchParams.set("arrange", params.arrange);
    if (params.mapX !== undefined) searchParams.set("mapX", String(params.mapX));
    if (params.mapY !== undefined) searchParams.set("mapY", String(params.mapY));
    if (params.radius !== undefined) searchParams.set("radius", String(params.radius));
    if (params.cat3) searchParams.set("cat3", params.cat3);

    return fetchTourApi<TourSpotBase>("locationBasedList2", searchParams);
  },

```

블록 전체 삭제 (앞뒤 빈 줄 포함). `tourApi` 객체의 다른 메서드는 그대로.

- [ ] **Step 3: TourApiListParams 타입에서 미사용 필드 확인**

```bash
grep -n "mapX\|mapY\|radius\|cat3" src/types/tour-api.ts src/lib/api/tour-api.ts
```

`mapX/mapY/radius/cat3`가 다른 함수에서도 사용된다면 keep. 만약 `locationBasedList` 전용이었다면 `TourApiListParams` 타입에서 optional 필드로 남겨도 무해. **타입 변경은 본 task 범위 밖**.

- [ ] **Step 4: 타입 체크**

```bash
pnpm exec tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Lint**

```bash
pnpm exec eslint src/lib/api/tour-api.ts
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/tour-api.ts
git commit -m "$(cat <<'EOF'
refactor: tour-api.ts에서 locationBasedList 함수 제거 (호출처 0)

PR2 Task 3 후 dead code. NearbyTourSection이 get_nearby_tour_items
PostGIS RPC로 전환되어 본 함수가 더 이상 호출되지 않음.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Self-review

1. `tourApi.locationBasedList` 함수 블록 제거.
2. tourApi 객체의 다른 메서드(detailIntro, detailImage 등 sync 스크립트가 쓰는 것들) 그대로.
3. `git grep locationBasedList -- src/` → 0 hits.
4. 1개 새 commit.

---

## Task 5: 종합 검증

**Files:** 없음 (verification)

### Steps

- [ ] **Step 1: tsc + eslint**

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/lib/data/destinations.ts src/lib/data/nearby-tour-recommendations.ts src/lib/api/tour-api.ts
```
Expected: 0 errors / no output.

- [ ] **Step 2: Production build**

```bash
pnpm build
```
Expected: exit 0.

- [ ] **Step 3: 회귀 grep**

```bash
grep -rn "tourApi\.locationBasedList" src/
```
Expected: 0 hits.

```bash
grep -rn "destinations\.intro_data\|destinations\.image_data" src/lib/data/
```
Expected: 0 hits in `lib/data/` (페이지/컴포넌트는 PR3에서 cleanup, 본 PR은 destinations.ts만).

```bash
grep -rn "destination_intros\|destination_images\|get_nearby_tour_items" src/
```
Expected: `destinations.ts`, `nearby-tour-recommendations.ts`에 references.

- [ ] **Step 4: 커밋 로그**

```bash
git log --oneline main..HEAD
```
Expected: 4개 commit (Task 1, 2, 3, 4).

- [ ] **Step 5: 동작 검증 (manual)**

운영 환경에서 임의 travel/[id], camping/[id], markets/[id], facilities/*/[id] 페이지 접속:

- "주변 추천 정보" 섹션 정상 렌더 (RPC 응답)
- 기본 정보 카드의 운영시간/주차 등 (IntroSection)
- 이미지 갤러리 (음식점 페이지)

DevTools Network 확인:
- `dapi.kakao.com/v2/local/search/keyword.json` 호출 있음 (KakaoLinkSection은 Step 3a plan 대상)
- `apis.data.go.kr/B551011/KorService2/locationBasedList2` 호출 **0** ✓
- `apis.data.go.kr/B551011/KorService2/detailIntro2` 호출 **0** ✓ (page에선 0, sync 스크립트만)
- `apis.data.go.kr/B551011/KorService2/detailImage2` 호출 **0** ✓

---

## Self-Review

### Spec coverage
| Spec section | 대응 task |
|---|---|
| §5.1 getDestinationIntro DB-only | Task 1 |
| §5.2 getDestinationImagesFromDb DB-only | Task 2 |
| §5.3 getNearbyTourRecommendations DB-first | Task 3 |
| §5.4 NearbyTourSection wrapper | 변경 불필요 (내부 함수만 바뀜) |
| §5.5 tour-api.ts 정리 | Task 4 |
| §6 PR2 scope | 본 plan 전체 |

### Placeholder scan
- 모든 step에 구체적 코드/명령어
- "TBD"/"implement later" 없음
- "Similar to Task N" 없음

### Type consistency
- `TourSpotDetail`, `TourImage`, `NearbyTourItem`, `NearbyTourRecommendations` 타입 모두 기존 정의 그대로 사용
- RPC row shape `NearbyTourRpcRow`는 migration 041 RETURNS TABLE과 정확히 일치
- 시그니처 불변: `getDestinationIntro(contentId)`, `getDestinationImagesFromDb(contentId)`, `getNearbyTourRecommendations({ lat, lng, ... })`, `getNearbyTourItems({ lat, lng, type, ... })` 모두 그대로

---

## 알려진 한계

- **Cafe 타입**: 기존 `tourApi.locationBasedList`는 `cat3="A05020900"`으로 카페/전통찻집 필터링 가능했음. 신규 RPC는 `content_type_id`만 지원 — cafe는 restaurant(39)와 같은 RPC 결과로 group. UI에서는 cafe 탭 데이터가 restaurant과 동일. **destinations 마스터에 cat3 컬럼이 있어 후속 PR에서 RPC에 cat3 파라미터 추가 가능**.
- **첫 이미지 누락 destination**: 기존 코드는 `firstimage || firstimage2`만 통과시켰음. RPC는 `first_image is not null`만 필터 — `firstimage2` 케이스는 누락. Plan 범위 밖, 운영 데이터 확인 후 결정.
- **JSON-encoded `serial_num`이 string인 경우**: PR1 `destination_images.serial_num int`로 정규화됨. TourImage 인터페이스가 `string`을 요구하면 `String(r.serial_num)` 변환 필요 (Task 2 코드 포함).
- **테스트 프레임워크 부재**: tsc + eslint + 빌드 + 회귀 grep + 운영 manual 확인으로 검증.
