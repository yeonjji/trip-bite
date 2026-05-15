# Step 1 — DB에 있는 데이터 외부 호출 제거 (Quick Wins) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `destinations` 테이블에 모든 필드가 이미 들어있는데도 매 요청마다 TourAPI를 호출하는 redundant 외부 호출 3건을 제거하고 dead code 1건을 정리한다.

**Architecture:** 외부 API 호출 제거만 수행. `destinations` row를 `TourDetailCommon` 형태로 직접 매핑해 `detail` 객체를 만든다. DB 컬럼이 없는 `detailIntro`/`detailImage`/`detailPetTour` 호출은 이 plan에서 다루지 않음 (Step 2 plan에서 마이그레이션과 함께 처리).

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (`destinations`, `pet_friendly_places` 테이블)

**Spec reference:** `docs/superpowers/specs/2026-05-15-db-first-external-api-audit.md` (Category A 항목 중 P0/P1)

**Verification:** 프로젝트에 테스트 프레임워크 미설정. 각 task는 `pnpm exec tsc --noEmit` + `pnpm exec eslint <files>` + 마지막에 `pnpm build`로 검증.

---

## File Structure

### Modified files
| 파일 | 변경 |
|---|---|
| `src/lib/data/destinations.ts` | `getDestinationShell`에서 `tourApi.detailCommon` 호출 제거, row → detail 직접 매핑. 미사용 imports/상수 정리 |
| `src/lib/data/restaurants.ts` | `getRestaurantDetail`에서 `tourApi.detailCommon` 호출 제거 (intro/images는 Step 2에서 처리 예정이므로 보존) |
| `src/lib/data/pet-places.ts` | `getPetPlaceDetail` 함수 자체 삭제 (호출처 0개 dead code) + 미사용 imports 정리 |

### 신규 파일
없음.

### 비목표 (Step 2 plan으로 분리)
- `destinations`에 `intro_data` / `image_data` jsonb 컬럼 추가
- `sync-destinations.mjs` 확장 (detailIntro/detailImage 백필)
- 음식점 페이지에서 보여지는 운영시간/이미지를 DB에서 읽도록 교체
- `getDestinationIntro` (현재 페이지의 IntroSection이 사용)는 Step 2 완료 후 DB에서 읽도록 교체

---

## Task 1: `getDestinationShell`에서 `detailCommon` 호출 제거

**Files:**
- Modify: `src/lib/data/destinations.ts`

**Context:**
현재 `getDestinationShell`은 `destinations` row를 가져온 후 `getCachedOrFetch(cached_at, 24h, () => tourApi.detailCommon(...))`로 detailCommon을 호출한다. 그러나:
- `destinations` 테이블에 detailCommon 응답의 모든 필드가 이미 있음 (`004_destinations.sql` 참조)
- `getCachedOrFetch` 만료 시 외부 호출하지만 결과를 DB에 저장하지 않음 → 다음 요청도 또 만료된 상태에서 또 호출
- 결과적으로 외부 호출이 이뤄질 때 그 응답이 row보다 더 신선하다는 보장도 없음 (sync 스크립트가 source of truth)

이 task는 외부 호출을 완전히 제거하고 row만으로 detail을 구성한다.

- [ ] **Step 1: 현재 `getDestinationShell` 구조 확인**

Run: `sed -n '130,200p' src/lib/data/destinations.ts`

기대 출력에 다음이 포함되어야 함:
- `getDestinationShell` 함수 선언 (line ~138 부근)
- `getCachedOrFetch(...) => tourApi.detailCommon(contentId)` 블록
- `if (freshDetail !== null) { ... } else if (destination) { detail = { ... } }` 분기

- [ ] **Step 2: `getDestinationShell` 내부 외부 호출 블록 교체**

`src/lib/data/destinations.ts`에서 다음 정확한 코드 블록을 찾아 교체:

**기존 (제거)**:
```ts
  // 24시간 캐시: 유효하면 Supabase row를 detail 형태로 변환, 만료/없으면 TourAPI detailCommon fetch
  let freshDetail = null;
  try {
    freshDetail = await getCachedOrFetch(
      destination?.cached_at ?? null,
      DESTINATION_TTL_HOURS,
      () => tourApi.detailCommon(contentId),
    );
  } catch {
    // TourAPI 실패 시 Supabase 데이터로 fallback
  }

  let detail: TourDetailCommon | null = null;
  if (freshDetail !== null) {
    try {
      const items = freshDetail.response.body.items;
      detail =
        items !== "" && Array.isArray(items.item) && items.item.length > 0 ? items.item[0] : null;
    } catch {
      detail = null;
    }
  } else if (destination) {
    detail = {
      contentid: destination.content_id,
      contenttypeid: destination.content_type_id,
      title: destination.title,
      homepage: destination.homepage,
      overview: destination.overview,
      createdtime: destination.created_at,
      modifiedtime: destination.updated_at,
      tel: destination.tel,
      addr1: destination.addr1,
      addr2: destination.addr2,
      mapx: destination.mapx != null ? String(destination.mapx) : undefined,
      mapy: destination.mapy != null ? String(destination.mapy) : undefined,
      firstimage: destination.first_image,
      firstimage2: destination.first_image2,
    };
  }
```

**교체 (신규)**:
```ts
  // destinations row가 source of truth. sync-destinations.mjs가 TourAPI 데이터를 정기적으로 채움.
  const detail: TourDetailCommon | null = destination
    ? {
        contentid: destination.content_id,
        contenttypeid: destination.content_type_id,
        title: destination.title,
        homepage: destination.homepage,
        overview: destination.overview,
        createdtime: destination.created_at,
        modifiedtime: destination.updated_at,
        tel: destination.tel,
        addr1: destination.addr1,
        addr2: destination.addr2,
        mapx: destination.mapx != null ? String(destination.mapx) : undefined,
        mapy: destination.mapy != null ? String(destination.mapy) : undefined,
        firstimage: destination.first_image,
        firstimage2: destination.first_image2,
      }
    : null;
```

- [ ] **Step 3: 미사용 imports/상수 제거**

이 변경 후 `destinations.ts`에서 다음 항목이 미사용이 됨:
- `import { getCachedOrFetch } from "@/lib/utils/cache";` — 다른 함수에서 사용 안 함 (확인: `grep -n getCachedOrFetch src/lib/data/destinations.ts` → 결과 0이면 제거)
- `const DESTINATION_TTL_HOURS = 24;` 상수 — 다른 곳에서 사용 안 함 (확인: `grep -n DESTINATION_TTL_HOURS src/lib/data/destinations.ts` → 결과 1줄(선언)만이면 제거)

`tourApi` import는 `getDestinationIntro` 함수에서 여전히 사용되므로 **유지**.

다음 두 줄을 파일에서 제거:
```ts
import { getCachedOrFetch } from "@/lib/utils/cache";
```
```ts
const DESTINATION_TTL_HOURS = 24;
```

- [ ] **Step 4: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Lint**

Run: `pnpm exec eslint src/lib/data/destinations.ts`
Expected: no output (0 issues)

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/destinations.ts
git commit -m "$(cat <<'EOF'
perf: getDestinationShell에서 tourApi.detailCommon 호출 제거

destinations 테이블에 detailCommon 응답의 모든 필드가 이미 있고
sync-destinations.mjs가 source of truth로 채워주므로 매 요청마다
외부 호출할 이유가 없음. row만으로 detail 객체 직접 구성.

미사용 import(getCachedOrFetch) 및 상수(DESTINATION_TTL_HOURS) 정리.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `getRestaurantDetail`에서 `detailCommon` 호출 제거

**Files:**
- Modify: `src/lib/data/restaurants.ts`

**Context:**
음식점 상세 페이지가 `getRestaurantDetail`을 호출하면 `tourApi.detailCommon` + `detailIntro` + `detailImage` 3건을 모두 외부 호출한다. 그중 `detailCommon`은 `destinations` row(content_type_id='39')에 이미 있는 정보. `detailIntro`/`detailImage`는 DB 컬럼이 없어서 일단 보존하고 Step 2에서 처리.

- [ ] **Step 1: 현재 함수 확인**

Run: `sed -n '69,119p' src/lib/data/restaurants.ts`

기대: `getRestaurantDetail` 함수가 `Promise.allSettled` 안에서 detailCommon/detailIntro/detailImage 3건을 호출하는 구조.

- [ ] **Step 2: `getRestaurantDetail` 본문 교체**

`src/lib/data/restaurants.ts`에서 다음 정확한 함수 본문을 찾아 교체:

**기존 (제거)**:
```ts
  const [detailRes, introRes, imagesRes] = await Promise.allSettled([
    tourApi.detailCommon(contentId),
    tourApi.detailIntro(contentId, "39"),
    tourApi.detailImage(contentId),
  ]);

  const detail =
    detailRes.status === "fulfilled"
      ? (detailRes.value.response.body.items !== ""
          ? detailRes.value.response.body.items.item[0]
          : null) ?? null
      : null;

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
    destination: (destination as Destination) ?? null,
    detail,
    intro,
    images,
  };
```

**교체 (신규)**:
```ts
  // destinations row(content_type_id='39')가 source of truth. detailCommon 호출 불필요.
  // detailIntro/detailImage는 DB 컬럼이 아직 없어 외부 호출 유지 (TODO: Step 2 plan).
  const dest = (destination as Destination) ?? null;
  const detail: TourDetailCommon | null = dest
    ? {
        contentid: dest.content_id,
        contenttypeid: dest.content_type_id,
        title: dest.title,
        homepage: dest.homepage,
        overview: dest.overview,
        createdtime: dest.created_at,
        modifiedtime: dest.updated_at,
        tel: dest.tel,
        addr1: dest.addr1,
        addr2: dest.addr2,
        mapx: dest.mapx != null ? String(dest.mapx) : undefined,
        mapy: dest.mapy != null ? String(dest.mapy) : undefined,
        firstimage: dest.first_image,
        firstimage2: dest.first_image2,
      }
    : null;

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

- [ ] **Step 3: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Lint**

Run: `pnpm exec eslint src/lib/data/restaurants.ts`
Expected: no output (0 issues)

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/restaurants.ts
git commit -m "$(cat <<'EOF'
perf: getRestaurantDetail에서 tourApi.detailCommon 호출 제거

destinations 테이블의 content_type_id='39' row가 source of truth.
detail 객체를 row에서 직접 구성. detailIntro/detailImage는
DB 컬럼이 아직 없어 보존 (Step 2 plan에서 마이그레이션 + 제거 예정).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `pet-places.ts`의 dead `getPetPlaceDetail` 함수 삭제

**Files:**
- Modify: `src/lib/data/pet-places.ts`

**Context:**
`getPetPlaceDetail` 함수는 `tourApi.detailPetTour`를 호출하지만 `git grep getPetPlaceDetail -- src/` 결과 호출처가 0개인 dead code다. 함수 자체를 삭제하면 `tourApi`와 `TourPetInfo` import도 미사용이 된다.

- [ ] **Step 1: 호출처 0개 재확인**

Run: `git grep -n "getPetPlaceDetail" -- "src/"`
Expected: `src/lib/data/pet-places.ts:51:export async function getPetPlaceDetail(` 1줄만 나타나야 함 (정의만, 호출 없음).

만약 다른 줄이 나타나면 STOP하고 controller에게 보고.

- [ ] **Step 2: 함수 + 미사용 import 삭제**

다음 두 위치에서 코드 제거:

**2-a. import 줄 제거** (`src/lib/data/pet-places.ts` 상단):

```ts
import { tourApi } from "@/lib/api/tour-api";
```
```ts
import type { TourPetInfo } from "@/types/tour-api";
```

위 두 줄을 삭제. 다른 imports(`createClient`, `PetFriendlyPlace`)는 `getPetPlaces`에서 사용 중이므로 **유지**.

**2-b. `getPetPlaceDetail` 함수 전체 삭제**:

다음 블록 전체를 삭제 (함수 위 빈 줄부터 함수 닫는 중괄호까지):
```ts
export async function getPetPlaceDetail(
  contentId: string
): Promise<{ place: PetFriendlyPlace | null; petTourInfo: TourPetInfo | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pet_friendly_places")
    .select("*")
    .eq("content_id", contentId)
    .single();

  if (error) {
    console.error("pet_friendly_places detail fetch error:", error.message);
    return { place: null, petTourInfo: null };
  }

  let petTourInfo: TourPetInfo | null = null;
  try {
    const petRes = await tourApi.detailPetTour(contentId);
    const petItems = petRes.response.body.items;
    petTourInfo = petItems !== "" && petItems.item.length > 0 ? petItems.item[0] : null;
  } catch {
    petTourInfo = null;
  }

  return { place: data as PetFriendlyPlace, petTourInfo };
}
```

- [ ] **Step 3: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Lint**

Run: `pnpm exec eslint src/lib/data/pet-places.ts`
Expected: no output (0 issues)

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/pet-places.ts
git commit -m "$(cat <<'EOF'
refactor: 호출처 없는 getPetPlaceDetail 함수 삭제 (dead code)

PR #36에서 page.tsx의 detailPetTour 호출이 제거된 후 본 함수는
호출처 0개로 dead code. 함수와 함께 미사용 imports(tourApi,
TourPetInfo) 정리.

반려동물 정보는 sync-pet-places.mjs가 채워주는 pet_friendly_places
테이블이 source of truth.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 종합 검증

**Files:** 없음 (verification only)

- [ ] **Step 1: 전체 type check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: 변경된 파일 lint**

Run:
```bash
pnpm exec eslint \
  src/lib/data/destinations.ts \
  src/lib/data/restaurants.ts \
  src/lib/data/pet-places.ts
```
Expected: no output (0 issues across all three files)

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: exit 0, all 48 static pages generated, no new errors. `travel/[id]` 및 `restaurants/[id]` 라우트가 ISR(`revalidate`)로 빌드되는지 확인.

- [ ] **Step 4: 잔여 외부 호출 확인 (회귀 방지)**

Run: `grep -n "tourApi.detailCommon\|tourApi.detailPetTour" src/lib/data/`
Expected: 출력 없음 (이 plan에서 모두 제거됨).

`tourApi.detailIntro`와 `tourApi.detailImage`는 여전히 `restaurants.ts`와 `destinations.ts`(`getDestinationIntro`)에 남아있어야 함 — Step 2 plan에서 처리 예정. 확인:

Run: `grep -n "tourApi.detailIntro\|tourApi.detailImage" src/lib/data/`
Expected:
- `src/lib/data/destinations.ts:<line>: tourApi.detailIntro(...)` (getDestinationIntro 내부)
- `src/lib/data/restaurants.ts:<line>: tourApi.detailIntro(...)`
- `src/lib/data/restaurants.ts:<line>: tourApi.detailImage(...)`

- [ ] **Step 5: 커밋 로그 확인**

Run: `git log --oneline main..HEAD`
Expected: 정확히 3개 commit (Task 1, 2, 3).

검증이 모두 통과하면 plan 완료.

---

## Self-Review

### Spec coverage
| Spec section | 대응 task |
|---|---|
| Category A: `destinations.ts:167` `tourApi.detailCommon` | Task 1 |
| Category A: `restaurants.ts:89` `tourApi.detailCommon` | Task 2 |
| Category A: `pet-places.ts:69` `tourApi.detailPetTour` | Task 3 (함수 자체 dead code) |
| Category A: `destinations.ts:321` `tourApi.detailPetTour` | 이미 PR #36에서 제거됨 (작업 불필요) |
| Category A: `restaurants.ts:90-91` `tourApi.detailIntro/Image` | **Step 2 plan으로 분리** (DB 컬럼 마이그레이션 + sync 확장 필요) |
| Category A: `destinations.ts:268-269` `tourApi.detailIntro/Image` | **Step 2 plan으로 분리** (`getDestinationDetail`은 이미 PR #37에서 dead code로 제거됨; `getDestinationIntro`는 IntroSection이 사용 중이므로 Step 2에서 DB-first로 교체) |

Step 1 plan의 scope = "DB 컬럼이 이미 존재하는 redundant 외부 호출만 제거". 그 외는 Step 2 plan으로 명시적으로 분리.

### Placeholder scan
- "TBD"/"TODO"/"implement later" — 본문에 없음 (Task 2의 코드 주석에 `TODO: Step 2 plan` 한 줄이 있으나, 이는 후속 작업이 명시된 spec/plan을 참조하는 의미 있는 마커이므로 의도된 사용)
- 모든 step에 구체적 코드 또는 명령어
- "Similar to Task N" 없음 (Task 1과 Task 2의 매핑 코드가 유사하지만 각 task에서 전체 코드 블록을 명시)

### Type consistency
- Task 1, 2 모두 `TourDetailCommon | null` 타입으로 `detail` 변수 선언
- Task 1, 2 매핑 필드: `contentid`, `contenttypeid`, `title`, `homepage`, `overview`, `createdtime`, `modifiedtime`, `tel`, `addr1`, `addr2`, `mapx`, `mapy`, `firstimage`, `firstimage2` — 모두 일치
- `destination` 변수명: Task 1은 함수 파라미터에서 추출, Task 2는 `dest` 별칭(기존 `destination`이 `unknown` raw 응답이라 타입 캐스팅을 명시화) — Task 2에서만 별칭 사용하는 이유 명시됨

---

## 알려진 한계

- 이 plan은 **DB가 이미 source of truth인 경우만** 처리. `detailIntro`/`detailImage` 같이 DB 컬럼이 없는 케이스는 Step 2 plan에서 마이그레이션과 함께 다룸.
- `sync-destinations.mjs`가 운영 환경에서 충분한 주기로 실행되지 않으면 destinations row의 데이터가 stale될 수 있음. 본 plan의 변경 자체는 stale을 *악화*시키지 않음(이전에도 외부 호출 결과를 DB에 저장 안 했음). sync 주기는 별도 운영 이슈로 추적 필요.
- 테스트 프레임워크 부재로 단위 테스트는 작성하지 않음. tsc + eslint + 빌드 + 회귀 grep으로 검증.
