# 상세 페이지 RSC Prefetch 성능 개선 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** travel/[id] RSC prefetch 시간을 200~300ms로 단축하고, 이후 모든 상세 페이지에 재사용 가능한 "Suspense 분할 + 좌표 라운딩 캐싱" 패턴을 확립한다.

**Architecture:** page.tsx는 SEO/LCP에 필요한 데이터만 즉시 await(`getDestinationDetail`)하고, 무거운 주변 정보 섹션들은 `<Suspense fallback={Skeleton}>` 안에서 self-fetching async server component로 streaming. 모든 좌표 기반 데이터 함수는 `unstable_cache`로 100m 격자 라운딩 키 캐싱(revalidate 1h).

**Tech Stack:** Next.js 15 App Router, React 19, Supabase, `unstable_cache`, shadcn `Skeleton`

**Spec Reference:** `docs/superpowers/specs/2026-05-15-detail-page-streaming-design.md`

**Verification:** 프로젝트에 테스트 프레임워크 미설정. 각 task는 `pnpm lint` + `pnpm build` + 브라우저 수동 확인으로 검증.

**Scope:** spec의 Phase 1 + Phase 2(travel reference)만 다룬다. Phase 3(다른 상세 페이지 적용)는 별도 plan으로 분리.

---

## File Structure

### 신규 파일

| 파일 | 역할 |
|---|---|
| `src/lib/utils/cache-key.ts` | 좌표 라운딩 + 캐시 키 생성 헬퍼 |
| `src/components/nearby/NearbyFacilitiesSection.tsx` | `getNearbyFacilitiesCached` 호출 + 기존 `NearbyFacilities` 렌더 |
| `src/components/nearby/NearbyFacilitiesSkeleton.tsx` | 섹션 fallback skeleton |
| `src/components/nearby/NearbyShopsSection.tsx` | `getNearbyShopsCached` 호출 + 기존 `NearbyShopsTravelSection` 렌더 |
| `src/components/nearby/NearbyShopsSkeleton.tsx` | 섹션 fallback skeleton |
| `src/components/nearby/NearbyTourSection.tsx` | `getNearbyTourRecommendationsCached` 호출 + 기존 `NearbyTourRecommendationsSection` 렌더 |
| `src/components/nearby/NearbyTourSkeleton.tsx` | 섹션 fallback skeleton |
| `src/components/nearby/NearbyRestaurantsSection.tsx` | `getNearbyRestaurantsCached` 호출 + `HorizontalScrollSection` 렌더 |
| `src/components/nearby/NearbyRestaurantsSkeleton.tsx` | 섹션 fallback skeleton |
| `src/components/travel/SpecialtiesSection.tsx` | `getSpecialtiesByRegionNameCached` 호출 + 기존 `TravelSpecialtiesSection` 렌더 |
| `src/components/travel/SpecialtiesSkeleton.tsx` | 섹션 fallback skeleton |

### 수정 파일

| 파일 | 변경 |
|---|---|
| `src/lib/data/nearby-shops.ts` | `getNearbyShopsCached` 신규 export |
| `src/lib/data/restaurants.ts` | `getNearbyRestaurantsCached` 신규 export |
| `src/app/[locale]/travel/[id]/page.tsx` | `force-dynamic` → `revalidate = 3600`, `Promise.all` 제거, Suspense 트리로 교체 |

---

## Phase 1 — 캐싱 인프라

### Task 1: 좌표 라운딩 유틸리티 추가

**Files:**
- Create: `src/lib/utils/cache-key.ts`

- [ ] **Step 1: 유틸리티 파일 작성**

```ts
// src/lib/utils/cache-key.ts
// 좌표 기반 unstable_cache 키 생성용 유틸리티.
// 100m 격자(소수점 3자리)로 라운딩해 "주변 1~2km" 검색의 캐시 히트율을 극대화.

export function roundCoord(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function coordKey(lat: number, lng: number): string {
  return `${roundCoord(lat)}:${roundCoord(lng)}`
}
```

- [ ] **Step 2: 타입 체크**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 0건

- [ ] **Step 3: lint**

Run: `pnpm lint`
Expected: 새 파일에 대한 경고 0건 (전체 lint는 기존 경고가 있을 수 있음 — 새 파일 관련만 확인)

- [ ] **Step 4: 커밋**

```bash
git add src/lib/utils/cache-key.ts
git commit -m "feat: 좌표 기반 캐시 키 유틸 추가 (100m 격자 라운딩)"
```

---

### Task 2: `getNearbyShopsCached` 추가

**Files:**
- Modify: `src/lib/data/nearby-shops.ts` (파일 끝에 추가)

- [ ] **Step 1: 기존 파일 상단 import 확인**

`src/lib/data/nearby-shops.ts:1-7`에 `createClient as createServerClient`가 import되어 있다. anon client는 `@supabase/supabase-js`에서 별도 import 필요. `unstable_cache`, `roundCoord`, `coordKey`도 추가 import.

- [ ] **Step 2: import 추가**

기존 import 블록 마지막에 추가:

```ts
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { roundCoord, coordKey } from "@/lib/utils/cache-key";
```

- [ ] **Step 3: anon client 헬퍼 추가**

`emptyResult` 함수 위(또는 파일 끝)에 추가:

```ts
// unstable_cache 내부 전용 (쿠키 의존 없는 클라이언트)
function getAnonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

**주의:** `getNearbyShops`는 내부적으로 `isCacheValid`/`fetchAndCache`에서 `supabase.from("nearby_shops").upsert(...)`를 호출하므로 anon 키로는 RLS에 막힐 수 있다. **캐시된 버전에서는 upsert 경로를 건너뛰고 RPC 결과만 가져오도록** 별도 구현이 필요.

- [ ] **Step 4: `getNearbyShopsCached` 구현 (파일 끝에 추가)**

```ts
import { ALL_SHOP_CATEGORIES } from "@/lib/constants/shop-categories";
// (위 import는 이미 있을 수 있음 — 중복 확인)

// 캐시된 버전 — 상세 페이지 Suspense 내부 전용.
// upsert 경로를 거치지 않고 RPC만 호출 (캐시가 비어있을 가능성이 있지만,
// 일반 getNearbyShops가 먼저 채워두면 됨. 첫 사용자는 캐시 미스 = 빈 결과 가능)
export function getNearbyShopsCached(
  lat: number,
  lng: number,
  radiusMeters = 1000,
  limitPerCategory = 5,
) {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  return unstable_cache(
    async (): Promise<NearbyShopsResult> => {
      const supabase = getAnonClient();
      const rpcResults = await Promise.allSettled(
        ALL_SHOP_CATEGORIES.map((cat) =>
          supabase.rpc("get_nearby_shops", {
            p_lat:         rLat,
            p_lng:         rLng,
            radius_meters: radiusMeters,
            result_limit:  limitPerCategory * 3,
            p_category:    cat,
          }),
        ),
      );

      const result = emptyResult();
      for (let i = 0; i < ALL_SHOP_CATEGORIES.length; i++) {
        const cat = ALL_SHOP_CATEGORIES[i];
        const rpc = rpcResults[i];
        if (rpc.status !== "fulfilled" || rpc.value.error) continue;
        const rows = (rpc.value.data ?? []) as Record<string, unknown>[];
        result[cat] = deduplicateBrands(rows.map(mapRpcRow)).slice(0, limitPerCategory);
      }
      return result;
    },
    ["nearby-shops", coordKey(rLat, rLng), String(radiusMeters), String(limitPerCategory)],
    { revalidate: 3600, tags: ["nearby-shops"] },
  )();
}
```

**중요 결정:** 캐시된 버전은 외부 API fetch/upsert 로직을 의도적으로 생략. cold cache 상황에서는 빈 결과를 반환할 수 있으나, 일반 `getNearbyShops`가 운영 중에 자연스럽게 DB를 채워가므로 1시간 단위 캐시로 충분히 정상화된다. (page에서는 일반 `getNearbyShops`가 더 이상 호출되지 않으므로, 다른 경로[Supabase admin sync 등]에서 채워야 한다.)

> **NOTE:** 만약 운영 중 nearby_shops 테이블이 잘 채워지지 않는 좌표가 있다면, 후속 작업으로 sync 스크립트를 만들어야 한다. 본 plan 범위에서는 다루지 않는다.

- [ ] **Step 5: 타입 체크 + 빌드 확인**

```bash
pnpm exec tsc --noEmit
```
Expected: 에러 0건

- [ ] **Step 6: 커밋**

```bash
git add src/lib/data/nearby-shops.ts
git commit -m "feat: getNearbyShopsCached 추가 (좌표 라운딩 + 1h revalidate)"
```

---

### Task 3: `getNearbyRestaurantsCached` 추가

**Files:**
- Modify: `src/lib/data/restaurants.ts`

- [ ] **Step 1: import 추가 (파일 상단)**

```ts
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { roundCoord, coordKey } from "@/lib/utils/cache-key";
```

- [ ] **Step 2: anon client 헬퍼 (파일 끝에 추가)**

```ts
function getAnonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: 캐시된 버전 구현 (파일 끝에 추가)**

```ts
export function getNearbyRestaurantsCached(
  lat: number,
  lng: number,
  excludeContentId?: string,
  radiusMeters = 5000,
  limit = 4,
) {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  return unstable_cache(
    async (): Promise<Destination[]> => {
      const supabase = getAnonClient();
      const { data, error } = await supabase.rpc("get_nearby_restaurants", {
        lat:           rLat,
        lng:           rLng,
        radius_meters: radiusMeters,
        result_limit:  limit,
        exclude_id:    excludeContentId ?? null,
      });
      if (error) {
        console.error("[getNearbyRestaurantsCached] RPC error:", error.message);
        return [];
      }
      return (data as Destination[]) ?? [];
    },
    [
      "nearby-restaurants",
      coordKey(rLat, rLng),
      excludeContentId ?? "none",
      String(radiusMeters),
      String(limit),
    ],
    { revalidate: 3600, tags: ["nearby-restaurants"] },
  )();
}
```

- [ ] **Step 4: 타입 체크**

```bash
pnpm exec tsc --noEmit
```
Expected: 에러 0건

- [ ] **Step 5: 커밋**

```bash
git add src/lib/data/restaurants.ts
git commit -m "feat: getNearbyRestaurantsCached 추가 (좌표 라운딩 + 1h revalidate)"
```

---

### Task 4: travel page에서 캐시 활용 + `force-dynamic` 제거 (Phase 1 마무리)

**Files:**
- Modify: `src/app/[locale]/travel/[id]/page.tsx`

**의도:** 이 task는 Phase 1의 즉시 효과를 검증하기 위한 *중간 단계*다. Suspense 분할은 다음 phase에서. 여기서는:
1. `force-dynamic` → `revalidate = 3600`
2. `Promise.all` 안의 함수 호출만 캐시된 버전으로 교체

Suspense는 아직 도입하지 않음.

- [ ] **Step 1: import 교체 (page.tsx:8-12)**

기존:
```ts
import { getNearbyRestaurants } from "@/lib/data/restaurants"
import { getSpecialtiesByRegionName } from "@/lib/data/specialties"
import { getNearbyFacilities } from "@/lib/data/nearby-facilities"
import { getNearbyShops } from "@/lib/data/nearby-shops"
import { getNearbyTourRecommendations } from "@/lib/data/nearby-tour-recommendations"
```

신규:
```ts
import { getNearbyRestaurantsCached } from "@/lib/data/restaurants"
import { getSpecialtiesByRegionNameCached } from "@/lib/data/specialties"
import { getNearbyFacilitiesCached } from "@/lib/data/nearby-facilities"
import { getNearbyShopsCached } from "@/lib/data/nearby-shops"
import { getNearbyTourRecommendationsCached } from "@/lib/data/nearby-tour-recommendations"
```

- [ ] **Step 2: page.tsx:5 force-dynamic 교체**

기존:
```ts
export const dynamic = "force-dynamic"
```

신규:
```ts
export const revalidate = 3600
```

- [ ] **Step 3: `Promise.all` 블록 교체 (page.tsx:103-116)**

기존:
```ts
const [nearbyRestaurants, nearbyFacilities, specialties, nearbyTourRecommendations, nearbyShops] = await Promise.all([
  hasCoords ? getNearbyRestaurants(lat!, lng!, id) : Promise.resolve([]),
  hasCoords ? getNearbyFacilities(lat!, lng!) : Promise.resolve({ toilets: [], wifi: [], parking: [], evStations: [], errors: undefined }),
  provinceFullName ? getSpecialtiesByRegionName(provinceFullName, 5) : Promise.resolve([]),
  hasCoords
    ? getNearbyTourRecommendations({
        lat: lat!,
        lng: lng!,
        excludeContentId: id,
        types: ["festival", "accommodation", "travel"],
      })
    : Promise.resolve({ travel: [], festival: [], accommodation: [], restaurant: [], cafe: [] }),
  hasCoords ? getNearbyShops(lat!, lng!) : Promise.resolve(null),
])
```

신규:
```ts
const [nearbyRestaurants, nearbyFacilities, specialties, nearbyTourRecommendations, nearbyShops] = await Promise.all([
  hasCoords ? getNearbyRestaurantsCached(lat!, lng!, id) : Promise.resolve([]),
  hasCoords ? getNearbyFacilitiesCached(lat!, lng!) : Promise.resolve({ toilets: [], wifi: [], parking: [], evStations: [] }),
  provinceFullName ? getSpecialtiesByRegionNameCached(provinceFullName, 5) : Promise.resolve([]),
  hasCoords
    ? getNearbyTourRecommendationsCached(lat!, lng!, id, ["festival", "accommodation", "travel"])
    : Promise.resolve({ travel: [], festival: [], accommodation: [], restaurant: [], cafe: [] }),
  hasCoords ? getNearbyShopsCached(lat!, lng!) : Promise.resolve(null),
])
```

**중요:**
- `getNearbyFacilitiesCached`는 `errors` 필드를 반환하지 않으므로, page에서 `nearbyFacilities.errors`를 사용하던 부분(page.tsx:484)을 `undefined`로 fallback.
- `getNearbyTourRecommendationsCached`의 시그니처는 `(lat, lng, excludeContentId, types, limitPerType?)` — 객체 인자가 아닌 위치 인자임. 확인 후 호출 형식 맞추기.

- [ ] **Step 4: `errors` 참조 정리 (page.tsx:484 부근)**

기존:
```tsx
<NearbyFacilities
  locale={locale}
  toilets={nearbyFacilities.toilets}
  wifi={nearbyFacilities.wifi}
  parking={nearbyFacilities.parking}
  evStations={nearbyFacilities.evStations}
  lat={lat}
  lng={lng}
  errors={nearbyFacilities.errors}
/>
```

신규:
```tsx
<NearbyFacilities
  locale={locale}
  toilets={nearbyFacilities.toilets}
  wifi={nearbyFacilities.wifi}
  parking={nearbyFacilities.parking}
  evStations={nearbyFacilities.evStations}
  lat={lat}
  lng={lng}
/>
```
`errors` prop 제거. (Suspense 분할 단계에서 캐시된 버전이 errors를 반환하지 않게 설계됨)

- [ ] **Step 5: 빌드**

```bash
pnpm build
```
Expected: 빌드 성공. travel/[id] 라우트가 `static` 또는 `revalidate` 표시로 빌드 출력에 나타나면 정상.

- [ ] **Step 6: 로컬 브라우저 검증**

```bash
pnpm dev
```
다른 터미널에서 진행:
1. http://localhost:3000/ko/travel 접속 → DevTools Network 탭 열기
2. travel 카드 viewport 진입 시 발생하는 `/ko/travel/{id}?_rsc=…` 요청 시간 관찰
3. **첫 방문**: 여전히 400~1000ms 가능 (캐시 미스)
4. **같은 카드 두 번째 방문**: 100ms 이하로 떨어지면 ✓
5. 페이지 콘텐츠가 첫 방문과 동일하게 보이는지 확인

- [ ] **Step 7: 커밋**

```bash
git add src/app/[locale]/travel/[id]/page.tsx
git commit -m "perf: travel 상세 페이지 캐싱 활성화 (force-dynamic→1h revalidate, *Cached 함수 사용)"
```

---

## Phase 2 — Suspense 분할

### Task 5: 공통 Skeleton 헬퍼 컴포넌트 (간단한 박스 셰이프)

**Files:**
- 이 task는 새 파일을 만들지 않는다. shadcn `<Skeleton>` 컴포넌트를 그대로 사용. 각 섹션별 skeleton은 후속 task에서 정의.

- [ ] **Step 1: shadcn Skeleton 확인**

```bash
cat src/components/ui/skeleton.tsx
```
Expected: `Skeleton` 컴포넌트가 export되어 있음. `className` props를 받아 `<div>`로 렌더링.

이 컴포넌트를 모든 섹션 skeleton에서 import해 사용.

(Task 5는 사실상 확인용이며, 별도 커밋 없음. 다음 task에서 본 구현 시작.)

---

### Task 6: `NearbyFacilitiesSection` (self-fetching wrapper) + Skeleton

**Files:**
- Create: `src/components/nearby/NearbyFacilitiesSection.tsx`
- Create: `src/components/nearby/NearbyFacilitiesSkeleton.tsx`

- [ ] **Step 1: Skeleton 작성**

```tsx
// src/components/nearby/NearbyFacilitiesSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function NearbyFacilitiesSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 mb-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Section wrapper 작성**

```tsx
// src/components/nearby/NearbyFacilitiesSection.tsx
import { getNearbyFacilitiesCached } from "@/lib/data/nearby-facilities"
import NearbyFacilities from "@/app/[locale]/travel/_components/NearbyFacilities"

interface Props {
  lat: number
  lng: number
  locale: string
}

export default async function NearbyFacilitiesSection({ lat, lng, locale }: Props) {
  try {
    const data = await getNearbyFacilitiesCached(lat, lng)
    return (
      <NearbyFacilities
        locale={locale}
        toilets={data.toilets}
        wifi={data.wifi}
        parking={data.parking}
        evStations={data.evStations}
        lat={lat}
        lng={lng}
      />
    )
  } catch (err) {
    console.error("[NearbyFacilitiesSection] failed:", err)
    return null
  }
}
```

- [ ] **Step 3: 타입 체크**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/nearby/NearbyFacilitiesSection.tsx src/components/nearby/NearbyFacilitiesSkeleton.tsx
git commit -m "feat: NearbyFacilitiesSection wrapper + skeleton 추가"
```

---

### Task 7: `NearbyShopsSection` + Skeleton

**Files:**
- Create: `src/components/nearby/NearbyShopsSection.tsx`
- Create: `src/components/nearby/NearbyShopsSkeleton.tsx`

- [ ] **Step 1: Skeleton 작성**

```tsx
// src/components/nearby/NearbyShopsSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function NearbyShopsSkeleton() {
  return (
    <section className="py-8">
      <div className="mb-5">
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Section wrapper 작성**

```tsx
// src/components/nearby/NearbyShopsSection.tsx
import { getNearbyShopsCached } from "@/lib/data/nearby-shops"
import NearbyShopsTravelSection from "./NearbyShopsTravelSection"

interface Props {
  lat: number
  lng: number
  isKo: boolean
}

export default async function NearbyShopsSection({ lat, lng, isKo }: Props) {
  try {
    const shops = await getNearbyShopsCached(lat, lng)
    if (!shops) return null
    return <NearbyShopsTravelSection shops={shops} isKo={isKo} />
  } catch (err) {
    console.error("[NearbyShopsSection] failed:", err)
    return null
  }
}
```

- [ ] **Step 3: 타입 체크**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/nearby/NearbyShopsSection.tsx src/components/nearby/NearbyShopsSkeleton.tsx
git commit -m "feat: NearbyShopsSection wrapper + skeleton 추가"
```

---

### Task 8: `NearbyTourSection` + Skeleton

**Files:**
- Create: `src/components/nearby/NearbyTourSection.tsx`
- Create: `src/components/nearby/NearbyTourSkeleton.tsx`

- [ ] **Step 1: Skeleton 작성**

```tsx
// src/components/nearby/NearbyTourSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function NearbyTourSkeleton() {
  return (
    <section className="mb-6">
      <div className="mb-4">
        <Skeleton className="h-3 w-16 mb-1" />
        <Skeleton className="h-7 w-72" />
      </div>
      <div className="mb-3 flex gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Section wrapper 작성**

```tsx
// src/components/nearby/NearbyTourSection.tsx
import { getNearbyTourRecommendationsCached, type NearbyTourType } from "@/lib/data/nearby-tour-recommendations"
import NearbyTourRecommendationsSection from "./NearbyTourRecommendations"

interface Props {
  lat: number
  lng: number
  excludeContentId: string
  tabOrder: NearbyTourType[]
  locale: string
}

export default async function NearbyTourSection({
  lat, lng, excludeContentId, tabOrder, locale,
}: Props) {
  try {
    const recommendations = await getNearbyTourRecommendationsCached(
      lat,
      lng,
      excludeContentId,
      tabOrder,
    )
    return (
      <NearbyTourRecommendationsSection
        recommendations={recommendations}
        tabOrder={tabOrder}
        locale={locale}
      />
    )
  } catch (err) {
    console.error("[NearbyTourSection] failed:", err)
    return null
  }
}
```

**확인 필요:** `getNearbyTourRecommendationsCached`의 시그니처가 `(lat, lng, excludeContentId, types, limitPerType?)`인지 직접 코드에서 확인. `src/lib/data/nearby-tour-recommendations.ts:167` 참고.

- [ ] **Step 3: 타입 체크**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/nearby/NearbyTourSection.tsx src/components/nearby/NearbyTourSkeleton.tsx
git commit -m "feat: NearbyTourSection wrapper + skeleton 추가"
```

---

### Task 9: `NearbyRestaurantsSection` + Skeleton

**Files:**
- Create: `src/components/nearby/NearbyRestaurantsSection.tsx`
- Create: `src/components/nearby/NearbyRestaurantsSkeleton.tsx`

- [ ] **Step 1: Skeleton 작성**

```tsx
// src/components/nearby/NearbyRestaurantsSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function NearbyRestaurantsSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between mb-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-40 shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Section wrapper 작성**

```tsx
// src/components/nearby/NearbyRestaurantsSection.tsx
import { getNearbyRestaurantsCached } from "@/lib/data/restaurants"
import HorizontalScrollSection from "@/components/shared/HorizontalScrollSection"
import { getAreaName } from "@/lib/constants/area-codes"

interface Props {
  lat: number
  lng: number
  excludeContentId: string
  locale: string
  isKo: boolean
}

export default async function NearbyRestaurantsSection({
  lat, lng, excludeContentId, locale, isKo,
}: Props) {
  try {
    const restaurants = await getNearbyRestaurantsCached(lat, lng, excludeContentId)
    if (restaurants.length === 0) return null
    return (
      <HorizontalScrollSection
        title={isKo ? "근처 맛집" : "Nearby Restaurants"}
        moreHref={`/${locale}/restaurants`}
        moreLabel={isKo ? "맛집 전체" : "All Restaurants"}
        items={restaurants.map((r) => ({
          href: `/${locale}/restaurants/${r.content_id}`,
          imageUrl: r.first_image,
          imagePlaceholder: "🍽",
          tag: getAreaName(r.area_code ?? ""),
          title: r.title,
          sub: r.addr1,
        }))}
      />
    )
  } catch (err) {
    console.error("[NearbyRestaurantsSection] failed:", err)
    return null
  }
}
```

- [ ] **Step 3: 타입 체크**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/nearby/NearbyRestaurantsSection.tsx src/components/nearby/NearbyRestaurantsSkeleton.tsx
git commit -m "feat: NearbyRestaurantsSection wrapper + skeleton 추가"
```

---

### Task 10: `SpecialtiesSection` + Skeleton

**Files:**
- Create: `src/components/travel/SpecialtiesSection.tsx`
- Create: `src/components/travel/SpecialtiesSkeleton.tsx`

- [ ] **Step 1: Skeleton 작성**

```tsx
// src/components/travel/SpecialtiesSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function SpecialtiesSkeleton() {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Section wrapper 작성**

```tsx
// src/components/travel/SpecialtiesSection.tsx
import { getSpecialtiesByRegionNameCached } from "@/lib/data/specialties"
import TravelSpecialtiesSection from "./TravelSpecialtiesSection"

interface Props {
  regionFullName: string | null
  regionName: string | null
  limit?: number
}

export default async function SpecialtiesSection({
  regionFullName, regionName, limit = 5,
}: Props) {
  if (!regionFullName) return null
  try {
    const specialties = await getSpecialtiesByRegionNameCached(regionFullName, limit)
    return (
      <TravelSpecialtiesSection
        specialties={specialties}
        regionName={regionName}
      />
    )
  } catch (err) {
    console.error("[SpecialtiesSection] failed:", err)
    return null
  }
}
```

- [ ] **Step 3: 타입 체크**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/travel/SpecialtiesSection.tsx src/components/travel/SpecialtiesSkeleton.tsx
git commit -m "feat: SpecialtiesSection wrapper + skeleton 추가"
```

---

### Task 11: `page.tsx` Suspense 트리로 재구성

**Files:**
- Modify: `src/app/[locale]/travel/[id]/page.tsx`

**의도:** Task 4에서 이미 캐시 함수를 사용 중. 이제 `Promise.all`을 제거하고 각 섹션을 `<Suspense>`로 감싼다. page 함수는 shell 데이터만 await한다.

- [ ] **Step 1: import 정리**

`Promise.all`이 호출하던 함수들의 import 제거 (Section wrapper 안에서 호출하므로 page에서는 불필요):

기존 import 삭제:
```ts
import { getNearbyRestaurantsCached } from "@/lib/data/restaurants"
import { getSpecialtiesByRegionNameCached } from "@/lib/data/specialties"
import { getNearbyFacilitiesCached } from "@/lib/data/nearby-facilities"
import { getNearbyShopsCached } from "@/lib/data/nearby-shops"
import { getNearbyTourRecommendationsCached } from "@/lib/data/nearby-tour-recommendations"
import { getAreaName } from "@/lib/constants/area-codes"
import HorizontalScrollSection from "@/components/shared/HorizontalScrollSection"
import NearbyFacilities from "../_components/NearbyFacilities"
import NearbyNaverPlaces from "@/components/nearby/NearbyNaverPlaces"
import NearbyTourRecommendationsSection from "@/components/nearby/NearbyTourRecommendations"
import TravelSpecialtiesSection from "@/components/travel/TravelSpecialtiesSection"
import NearbyShopsTravelSection from "@/components/nearby/NearbyShopsTravelSection"
```

기존 import 유지 (shell이나 client 컴포넌트):
```ts
// 그대로:
import RecipeRecommendationSection from "@/components/recipes/RecipeRecommendationSection"
import TravelBlogReviewSection from "@/components/travel/TravelBlogReviewSection"
import NearbyNaverPlaces from "@/components/nearby/NearbyNaverPlaces"
```

신규 import:
```ts
import { Suspense } from "react"
import NearbyFacilitiesSection from "@/components/nearby/NearbyFacilitiesSection"
import NearbyFacilitiesSkeleton from "@/components/nearby/NearbyFacilitiesSkeleton"
import NearbyShopsSection from "@/components/nearby/NearbyShopsSection"
import NearbyShopsSkeleton from "@/components/nearby/NearbyShopsSkeleton"
import NearbyTourSection from "@/components/nearby/NearbyTourSection"
import NearbyTourSkeleton from "@/components/nearby/NearbyTourSkeleton"
import NearbyRestaurantsSection from "@/components/nearby/NearbyRestaurantsSection"
import NearbyRestaurantsSkeleton from "@/components/nearby/NearbyRestaurantsSkeleton"
import SpecialtiesSection from "@/components/travel/SpecialtiesSection"
import SpecialtiesSkeleton from "@/components/travel/SpecialtiesSkeleton"
```

- [ ] **Step 2: `Promise.all` 블록 삭제 (page.tsx:103-116)**

해당 블록 전체 삭제. `nearbyRestaurants`, `nearbyFacilities`, `specialties`, `nearbyTourRecommendations`, `nearbyShops` 변수가 더 이상 page 스코프에 존재하지 않음.

- [ ] **Step 3: JSX 본문에서 해당 변수 사용처를 Section 컴포넌트로 교체**

**3a. 주변 편의시설 (기존 page.tsx:476-485)**

기존:
```tsx
{/* 주변 편의시설 */}
<NearbyFacilities
  locale={locale}
  toilets={nearbyFacilities.toilets}
  wifi={nearbyFacilities.wifi}
  parking={nearbyFacilities.parking}
  evStations={nearbyFacilities.evStations}
  lat={lat}
  lng={lng}
/>
```

신규:
```tsx
{/* 주변 편의시설 */}
{hasCoords && (
  <Suspense fallback={<NearbyFacilitiesSkeleton />}>
    <NearbyFacilitiesSection lat={lat!} lng={lng!} locale={locale} />
  </Suspense>
)}
```

**3b. 주변 생활 편의 (기존 page.tsx:487-490)**

기존:
```tsx
{/* 주변 생활 편의 */}
{nearbyShops && (
  <NearbyShopsTravelSection shops={nearbyShops} isKo={isKo} />
)}
```

신규:
```tsx
{/* 주변 생활 편의 */}
{hasCoords && (
  <Suspense fallback={<NearbyShopsSkeleton />}>
    <NearbyShopsSection lat={lat!} lng={lng!} isKo={isKo} />
  </Suspense>
)}
```

**3c. 주변 추천 정보 (기존 page.tsx:492-497)**

기존:
```tsx
{/* 주변 추천 정보 */}
<NearbyTourRecommendationsSection
  recommendations={nearbyTourRecommendations}
  tabOrder={["festival", "accommodation", "travel"]}
  locale={locale}
/>
```

신규:
```tsx
{/* 주변 추천 정보 */}
{hasCoords && (
  <Suspense fallback={<NearbyTourSkeleton />}>
    <NearbyTourSection
      lat={lat!}
      lng={lng!}
      excludeContentId={id}
      tabOrder={["festival", "accommodation", "travel"]}
      locale={locale}
    />
  </Suspense>
)}
```

**3d. 이 지역 특산품 (기존 page.tsx:505-506)**

기존:
```tsx
{/* 이 지역 특산품 */}
<TravelSpecialtiesSection specialties={specialties} regionName={regionName} />
```

신규:
```tsx
{/* 이 지역 특산품 */}
{provinceFullName && (
  <Suspense fallback={<SpecialtiesSkeleton />}>
    <SpecialtiesSection
      regionFullName={provinceFullName}
      regionName={regionName}
      limit={5}
    />
  </Suspense>
)}
```

**3e. 근처 맛집 (기존 page.tsx:508-523)**

기존:
```tsx
{/* 근처 맛집 */}
{nearbyRestaurants.length > 0 && (
  <HorizontalScrollSection
    title={isKo ? "근처 맛집" : "Nearby Restaurants"}
    moreHref={`/${locale}/restaurants`}
    moreLabel={isKo ? "맛집 전체" : "All Restaurants"}
    items={nearbyRestaurants.map((r) => ({
      href: `/${locale}/restaurants/${r.content_id}`,
      imageUrl: r.first_image,
      imagePlaceholder: "🍽",
      tag: getAreaName(r.area_code ?? ""),
      title: r.title,
      sub: r.addr1,
    }))}
  />
)}
```

신규:
```tsx
{/* 근처 맛집 */}
{hasCoords && (
  <Suspense fallback={<NearbyRestaurantsSkeleton />}>
    <NearbyRestaurantsSection
      lat={lat!}
      lng={lng!}
      excludeContentId={id}
      locale={locale}
      isKo={isKo}
    />
  </Suspense>
)}
```

**3f. RecipeRecommendationSection은 이미 async self-fetching이므로 Suspense만 감싸기 (기존 page.tsx:502-503)**

기존:
```tsx
{/* 지역 레시피 추천 */}
<RecipeRecommendationSection regionName={regionName} context="travel" locale={locale} />
```

신규:
```tsx
{/* 지역 레시피 추천 */}
<Suspense fallback={null}>
  <RecipeRecommendationSection regionName={regionName} context="travel" locale={locale} />
</Suspense>
```

(fallback은 `null` — 레시피는 부가 정보라 skeleton 없이도 무방. 자연스러운 etrolar.)

**3g. `TravelBlogReviewSection`, `NearbyNaverPlaces`는 그대로 둠** — `"use client"` 컴포넌트라 SSR streaming 영향 없음.

- [ ] **Step 4: 빌드**

```bash
pnpm build
```
Expected: 빌드 성공. 라우트 출력에서 travel/[id]가 ISR(`revalidate`)로 표시되면 정상.

- [ ] **Step 5: 로컬 검증 — 페이지 동작**

```bash
pnpm dev
```
다른 터미널:
1. http://localhost:3000/ko/travel/126508 (또는 임의 id) 접속
2. 페이지가 즉시 렌더되는지 확인 (title, 갤러리, 기본정보, 지도까지)
3. 아래쪽 섹션들이 skeleton → 실제 콘텐츠 순으로 streaming되는지 확인
4. DevTools → Network → travel/[id]?_rsc=… 응답 시간이 **200~300ms**로 떨어졌는지 확인 (캐시 hit 시 더 빠름)
5. 좌표 없는 여행지(있다면)에서 주변 정보 섹션이 모두 사라지는지 확인

- [ ] **Step 6: 에러 격리 수동 테스트 (선택)**

`getNearbyShopsCached` 함수 시작에 `throw new Error("test")`를 한 줄 잠시 추가 → 페이지 새로고침 → 다른 섹션은 정상 렌더, NearbyShops만 사라지는지 확인. 확인 후 `throw` 제거.

- [ ] **Step 7: 커밋**

```bash
git add src/app/[locale]/travel/[id]/page.tsx
git commit -m "perf: travel 상세 페이지 Suspense 스트리밍 도입

무거운 주변 정보 섹션들(편의시설/소상공인/관광/맛집/특산품)을
self-fetching async 컴포넌트로 추출하고 <Suspense>로 감쌌다.
page shell(getDestinationDetail)만 즉시 await, 나머지는 스트리밍.
한 섹션 실패가 다른 섹션 렌더를 막지 않는 failure-tolerant 구조."
```

---

## Task 12: 최종 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 빌드 + lint**

```bash
pnpm lint
pnpm build
```
Expected: 모두 통과. (기존 lint 경고는 무시 — 새로 추가된 파일이 새 경고를 만들지 않으면 OK)

- [ ] **Step 2: 브라우저 종합 시나리오 확인**

1. http://localhost:3000/ko/travel 카드 → DevTools Network — RSC prefetch가 200~300ms 수준
2. 임의 카드 클릭 → 상세 페이지 shell이 즉시 보이고 섹션 streaming
3. 같은 카드를 다시 클릭 → 거의 즉시 렌더 (캐시 히트)
4. 반려동물 동반 카드 / 휠체어 접근 카드 등 특수 case도 정상 렌더
5. 모바일 뷰포트(DevTools Device Toolbar)에서도 skeleton/layout 정상

- [ ] **Step 3: 같은 좌표 두 페이지 비교 (캐시 응집도 확인)**

서로 가까운 두 여행지(약 100m 이내)를 골라 차례로 방문 → 두 번째 페이지의 주변 시설/소상공인 섹션이 더 빨라야 함 (`coordKey`가 같은 값으로 라운딩되어 캐시 히트).

- [ ] **Step 4: Phase 1만 적용했을 때 대비 측정 결과 정리 (선택)**

DevTools Performance 탭에서 prefetch 응답 시간 표본을 5~10개 수집해 기록. 임시 메모로 충분.

---

## Self-Review

(이 섹션은 plan을 작성한 후 작성자가 직접 점검한 결과)

### Spec coverage

| Spec section | 대응 task |
|---|---|
| §3 결정 사항 | Phase 1~2 전체 |
| §4.1 아키텍처 | Task 11 |
| §4.2 컴포넌트 경계 | Task 6~10 |
| §4.3 캐시 키 설계 (좌표 라운딩) | Task 1 |
| §4.3 unstable_cache 적용 | Task 2, 3 (기존 cached 함수는 Task 4에서 호출 교체) |
| §4.3 페이지 단 revalidate | Task 4 |
| §4.4 에러 처리 (try/catch → null) | Task 6~10 각 wrapper |
| §4.5 page shell 즉시 렌더 | Task 11 (Promise.all 제거, getDestinationDetail만 await) |
| §5 마이그레이션 Phase 1 | Task 1~4 |
| §5 마이그레이션 Phase 2 | Task 5~11 |
| §6 위험요소 (force-dynamic 제거, anon client) | Task 2, 3, 4 본문에서 다룸 |

Phase 3는 명시적으로 본 plan 범위 밖 (별도 plan 예정).

### Placeholder scan

- "TBD", "TODO" 없음
- "implement later" 없음
- 모든 step에 구체적 코드/명령어 포함
- "유사하게…" 같은 단축 표현 없음

### Type consistency

- `getNearbyShopsCached(lat, lng, radiusMeters?, limitPerCategory?)`: 모든 호출처(Task 4, Task 7)에서 첫 2개 인자만 사용 — 일치
- `getNearbyRestaurantsCached(lat, lng, excludeContentId?, radiusMeters?, limit?)`: Task 4, Task 9 모두 첫 3개 인자만 사용 — 일치
- `getNearbyTourRecommendationsCached(lat, lng, excludeContentId, types, limitPerType?)`: 위치 인자 시그니처 — Task 4, Task 8 모두 동일 호출 패턴 — 일치
- `getSpecialtiesByRegionNameCached(regionFullName, limit?)`: Task 4(5), Task 10(5) — 일치
- `NearbyFacilitiesSection` props: `{ lat, lng, locale }` — Task 6, Task 11 일치
- `NearbyShopsSection` props: `{ lat, lng, isKo }` — Task 7, Task 11 일치
- `NearbyTourSection` props: `{ lat, lng, excludeContentId, tabOrder, locale }` — Task 8, Task 11 일치
- `NearbyRestaurantsSection` props: `{ lat, lng, excludeContentId, locale, isKo }` — Task 9, Task 11 일치
- `SpecialtiesSection` props: `{ regionFullName, regionName, limit? }` — Task 10, Task 11 일치

### 알려진 한계

- `getNearbyShopsCached`는 외부 API fetch/upsert를 건너뛴다 (anon client + 좌표 라운딩 충돌 회피). 새 좌표 영역에서는 일반 `getNearbyShops`가 호출되어 DB를 채워야 하지만, page에서는 더 이상 일반 버전을 호출하지 않는다. 운영 중 빈 결과가 자주 발생하면 후속 작업으로 sync 스크립트가 필요. **이 한계는 spec §6 "캐시 invalidation 누락" 위험과 같은 클래스로 다룸.**
- 테스트 프레임워크 부재로 단위 테스트는 작성하지 않는다. 모든 검증은 build/lint + 브라우저 수동.
