# 상세 페이지 RSC Prefetch 성능 개선 — 스트리밍 + 캐싱 설계

- **작성일**: 2026-05-15
- **작성자**: Claude (brainstorming with @jiyeonjeong)
- **상태**: Draft (사용자 리뷰 대기)
- **대상 코드**: `src/app/[locale]/travel/[id]/page.tsx` 및 후속 모든 상세 페이지

## 1. 배경

### 1.1 관측된 문제

여행지 목록 페이지(`/ko/travel`)에서 카드들이 viewport에 들어오면 Next.js Link가 RSC payload를 prefetch한다. Chrome Network 탭 관측 결과 각 `/ko/travel/{id}?_rsc=…` 요청이 **400~1000ms** 소요. 한 화면에서 동시에 10~20개가 발생하면서 서버 부하·외부 API 호출량이 폭증.

### 1.2 원인

`src/app/[locale]/travel/[id]/page.tsx`가 prefetch마다 다음을 모두 실행:

| 함수 | 내부 호출 |
|---|---|
| `getDestinationDetail` | Supabase ×3 + TourAPI ×4(detailCommon/Intro/Image/PetTour) + Wikipedia + Kakao |
| `getNearbyRestaurants` | Supabase RPC |
| `getNearbyFacilities` | Supabase RPC ×4 (toilets/wifi/parking/ev) |
| `getNearbyTourRecommendations` | TourAPI ×3 (travel/festival/accommodation) |
| `getNearbyShops` | Supabase count + 외부 API + RPC ×7 |
| `getSpecialtiesByRegionName` | Supabase |

게다가 page에 `export const dynamic = "force-dynamic"`이 걸려있어 캐시가 무력화. 이미 만들어둔 `getNearbyFacilitiesCached`, `getNearbyTourRecommendationsCached`도 페이지에서 사용되지 않음.

### 1.3 영향

- 사용자 체감: viewport prefetch가 다 끝나기 전에 클릭하면 서버가 이미 같은 작업을 수행 중이라 추가 대기가 발생할 수 있음.
- 운영: Supabase Edge Functions 호출량과 TourAPI 일일 한도 소진 위험.
- 확장성: 상세 페이지 섹션이 추가될수록 prefetch 비용이 선형 증가. 현재 약 12개 섹션, 향후 추가 예정.

## 2. 목표

- RSC prefetch 시간을 **200~300ms 수준**으로 단축 (page shell만 prefetch).
- 동일 좌표 재방문 시 외부 API 호출 0 (캐시 히트).
- travel/[id]를 reference 구현으로 삼아 **모든 상세 페이지에 재사용 가능한 패턴** 확립.
- 한 섹션 실패가 페이지 전체를 망가뜨리지 않는 failure-tolerant 구조.

### 2.1 비목표

- 목록 페이지(`/travel`, `/restaurants` 등) listing 페이지 최적화는 이 spec에서 다루지 않음.
- 리뷰/평점은 이미 클라이언트 컴포넌트(`ReviewSection`)이므로 변경 대상 아님.
- 날씨 위젯(`WeatherWidget`), 대중교통(`TransitSection`), 관광 빅데이터 팁(`TravelTipSection`)은 이미 자체 fetching/클라이언트 컴포넌트이므로 캐시 정책은 각 컴포넌트의 기존 설정을 유지. 본 spec의 1시간 revalidate 정책 대상 아님.
- `error.tsx` 라우트 에러 경계 추가 안 함 (root error boundary로 충분).

## 3. 결정 사항 (브레인스토밍 합의)

| 결정 | 값 |
|---|---|
| 적용 범위 | 모든 상세 페이지 공통 패턴화 (travel/[id]를 reference) |
| 캐시 정책 | 1시간 revalidate (`unstable_cache` + 페이지 `revalidate = 3600`) |
| Skeleton 스타일 | 섹션별 스켈레톤 (shadcn `<Skeleton>` + 프로젝트 디자인 톤) |
| 디렉토리 구조 | 신설하지 않고 기존 도메인별 디렉토리(`nearby/`, `travel/`, …) 활용 |
| 접근 방식 | Hybrid (Suspense 분할 + 섹션별 캐싱 + 재사용 가능 패턴) |

## 4. 설계

### 4.1 아키텍처 개요

```
src/app/[locale]/travel/[id]/page.tsx
  ├── (shell, 즉시 await)
  │     getDestinationDetail(id)  ← cache() 유지, 페이지 단 revalidate 1h
  │     → title, addr, gallery, info card, overview, wiki, kakao link, NaverMap
  │
  └── (streaming, Suspense)
        ├── <NearbyFacilitiesSection lat lng locale />
        ├── <NearbyShopsSection lat lng isKo />
        ├── <NearbyTourSection lat lng excludeId locale />
        ├── <NearbyRestaurantsSection lat lng excludeId locale />
        ├── <SpecialtiesSection regionName limit={5} />
        ├── <TravelBlogReviewSection placeName regionName />
        ├── <RecipeRecommendationSection regionName locale />
        └── <NaverNearbyPlacesSection regionName />
```

### 4.2 컴포넌트 경계

각 무거운 섹션은 **자기 데이터를 직접 fetching하는 async server component**로 추출. 위치는 기존 도메인 디렉토리 유지.

| 새/이전 컴포넌트 | 위치 | 역할 |
|---|---|---|
| `NearbyFacilitiesSection.tsx` | `src/components/nearby/` | `getNearbyFacilitiesCached` 호출 후 기존 `NearbyFacilities` 렌더 |
| `NearbyShopsSection.tsx` | `src/components/nearby/` | `getNearbyShopsCached` 호출 후 기존 `NearbyShopsTravelSection` 렌더 |
| `NearbyTourSection.tsx` | `src/components/nearby/` | 기존 `NearbyTourRecommendations` 래퍼화 |
| `NearbyRestaurantsSection.tsx` | `src/components/nearby/` | 기존 `HorizontalScrollSection` 사용 부분 추출 |
| `SpecialtiesSection.tsx` | `src/components/travel/` | 기존 `TravelSpecialtiesSection` 래퍼화 |
| 기존 `RecipeRecommendationSection` | `src/components/recipes/` | 이미 self-fetching일 가능성 — 확인 후 그대로 사용 |
| 기존 `TravelBlogReviewSection` | `src/components/travel/` | 이미 self-fetching — 그대로 사용 |
| 기존 `NearbyNaverPlaces` | `src/components/nearby/` | 이미 self-fetching — 그대로 사용 |

**naming convention**: 데이터 fetching을 안에서 하는 server-only 래퍼는 `*Section.tsx`, 순수 presentational은 기존 이름 유지. page.tsx에서는 항상 `*Section`을 Suspense로 감싸 import.

**Skeleton**: 각 도메인 디렉토리에 `*Skeleton.tsx` 동거. shadcn `<Skeleton>` 컴포넌트 + 기존 디자인 토큰(`bg-[#F9F7EF]`, `soft-card-shadow`) 적용.

### 4.3 데이터 흐름 & 캐싱

#### 좌표 라운딩

```ts
// src/lib/utils/cache-key.ts
export const roundCoord = (n: number) => Math.round(n * 1000) / 1000  // ≈ 100m
export const coordKey = (lat: number, lng: number) =>
  `${roundCoord(lat)}:${roundCoord(lng)}`
```

100m 격자면 "주변 1~2km" 검색 결과가 사실상 동일하므로 캐시 히트율 극대화.

#### `unstable_cache` 적용

```ts
// 예: src/lib/data/nearby-shops.ts
export const getNearbyShopsCached = (lat: number, lng: number) =>
  unstable_cache(
    () => getNearbyShops(roundCoord(lat), roundCoord(lng)),
    ["nearby-shops", coordKey(lat, lng)],
    { revalidate: 3600, tags: ["nearby-shops"] },
  )()
```

| 함수 | 캐시 키 구성 요소 | revalidate |
|---|---|---|
| `getNearbyFacilitiesCached` | rounded lat/lng | 3600s |
| `getNearbyShopsCached` | rounded lat/lng | 3600s |
| `getNearbyTourRecommendationsCached` | rounded lat/lng + excludeId + types | 3600s |
| `getNearbyRestaurantsCached` | rounded lat/lng + excludeId | 3600s |
| `getSpecialtiesByRegionNameCached` | regionName + limit | 86400s |
| `getDestinationDetail` | id (`cache()` 유지) | 페이지 단 revalidate에 위임 |

#### 페이지 단 캐시

```tsx
// page.tsx
export const revalidate = 3600  // ← force-dynamic 제거 후 교체
```

#### Suspense 패턴

```tsx
<Suspense fallback={<NearbyFacilitiesSkeleton />}>
  <NearbyFacilitiesSection lat={lat} lng={lng} locale={locale} />
</Suspense>
```

page.tsx에서 `Promise.all`로 묶여있던 5개 호출은 모두 제거.

### 4.4 에러 처리

**원칙**: 주변 정보 섹션은 failure-tolerant. 실패해도 페이지는 살아있어야 함.

- 각 `*Section` 내부에서 `try/catch` → 실패 시 `null` 반환 (섹션이 자연스럽게 사라짐)
- 데이터가 비어있을 때(외딴 지역 등)와 동일한 UX로 통일됨
- `getDestinationDetail` 실패 시에만 `notFound()` — page shell이라 필수
- `error.tsx`는 추가하지 않음

### 4.5 Page Shell 즉시 렌더 대상

| 데이터 | 출처 | 즉시 await 이유 |
|---|---|---|
| title, addr, tel, overview | `getDestinationDetail.detail/destination` | SEO/OG 메타데이터 |
| galleryImages | `getDestinationDetail.images` | LCP 이미지 |
| intro (기본 정보 카드) | `getDestinationDetail.intro` | 첫 화면 핵심 정보 |
| wiki, kakaoPlace | `getDestinationDetail.wiki/kakaoPlace` | 이미 같이 fetch됨, 분리 이득 적음 |
| NaverMap | 좌표만 필요 | 클라이언트 컴포넌트로 즉시 렌더 |
| accessibility, petPlace | DB 단순 조회 | 첫 화면 뱃지에 필요 |

## 5. 마이그레이션 순서

### Phase 1 — 캐싱 인프라 (변경 최소, 효과 큼)

1. `src/lib/utils/cache-key.ts` 추가 — `roundCoord`, `coordKey`
2. 데이터 함수에 `unstable_cache` 래퍼 추가
   - `getNearbyShopsCached` (신규)
   - `getNearbyRestaurantsCached` (신규)
   - `getSpecialtiesByRegionNameCached` (신규)
   - `getNearbyFacilitiesCached`, `getNearbyTourRecommendationsCached` 는 이미 존재 — page에서 사용하도록 교체만
3. `page.tsx`에서 `force-dynamic` 제거 → `revalidate = 3600`

**검증 기준**: 동일 좌표 두 번째 방문 시 RSC prefetch가 100ms 이내.

### Phase 2 — Suspense 분할 (travel reference 구현)

4. 각 도메인 디렉토리에 `*Section.tsx` (self-fetching wrapper) + `*Skeleton.tsx` 추가
5. `page.tsx`의 `Promise.all` 블록 삭제, Suspense 트리로 교체
6. shell에 필요한 데이터(`getDestinationDetail`, `accessibility`)만 await로 남김

**검증 기준**: RSC prefetch 200~300ms, page shell 즉시 표시 후 섹션 streaming. 한 섹션이 500 에러를 내도 다른 섹션은 정상 렌더.

### Phase 3 — 다른 상세 페이지 적용

7. `restaurants/[id]`, `camping/[id]`, `specialties/[id]` 등에 동일 `*Section` 컴포넌트 재사용
8. 케이스별로 page shell에 필요한 데이터만 식별, 나머지는 Suspense

## 6. 위험 요소

| 위험 | 영향 | 대응 |
|---|---|---|
| `force-dynamic` 제거 후 쿠키 기반 Supabase 인증 동작 변화 | 로그인 상태 유지 실패 | 상세 페이지는 익명 읽기 위주, `*Cached`는 anon client 사용. 인증 필요한 데이터(리뷰 작성 등)는 이미 클라이언트 컴포넌트로 분리되어 있음 |
| `unstable_cache`가 큰 객체를 직렬화하며 메모리 증가 | 서버 메모리 압박 | 캐시 키 격자 100m로 한정, 응답 페이로드는 이미 작음 (`limit=5~10`) |
| Suspense streaming이 SEO에 미치는 영향 | 크롤러가 streaming 후 콘텐츠를 못 볼 가능성 | shell에 SEO 핵심(title, overview, addr, OG image) 모두 즉시 렌더 — streaming 영역은 보조 정보. 크롤러는 streaming도 처리함(2026 기준 Google/Bing 모두 지원) |
| 캐시 invalidation 누락으로 stale 데이터 노출 | 신규 등록 여행지가 1시간 안 보임 | 데이터 sync 스크립트(`scripts/sync-*.mjs`)에서 `revalidateTag` 호출 추가 — 별도 후속 작업으로 분리 |

## 7. 미해결 질문 (구현 단계에서 결정)

- `RecipeRecommendationSection`, `TravelBlogReviewSection`, `NearbyNaverPlaces`가 이미 self-fetching인지 코드 확인 필요 — 그렇다면 Suspense 래핑만으로 충분
- `accessibility = await getAccessibilityInfo(destination.id)` 도 shell이 아닌 streaming으로 빼는 게 더 빠를지 검토 (현재는 shell에서 await)
- Phase 3에서 각 상세 페이지가 노출하는 섹션이 다른데, `*Section` 컴포넌트별 노출 정책은 page에서 호출 여부로만 결정 (별도 config 없음)

## 8. 참고 자료

- 현재 page.tsx: `src/app/[locale]/travel/[id]/page.tsx`
- 캐시된 데이터 함수: `src/lib/data/nearby-facilities.ts:146`, `src/lib/data/nearby-tour-recommendations.ts:166`
- Next.js docs: streaming with `<Suspense>`, `unstable_cache`, route segment `revalidate`
