# DB-First 외부 API 호출 감사 및 개선 계획

- **작성일**: 2026-05-15
- **트리거**: PR #36 후 사용자가 "DB에 데이터가 있는데도 외부 API를 매번 호출하는 곳들이 있다"는 점을 발견
- **상태**: Draft (사용자 리뷰 대기)

## 1. 배경

PR #35 + #36으로 상세 페이지 Suspense 분할 + shell 분리를 진행했음. 그러나 외부 API 호출의 **결과를 DB에 저장하지 않는** 패턴이 코드베이스 전반에 퍼져 있음:

- `getCachedOrFetch`는 만료 시 외부 호출하지만 결과를 DB에 upsert하지 않음 → 다음 요청도 또 만료된 상태라 또 외부 호출 (사실상 캐싱 무력화)
- `unstable_cache`는 메모리 캐시라 서버 재시작/스케일아웃 시 사라짐
- 일부 외부 API는 **이미 동일한 데이터가 DB에 있는데도** 외부 호출됨 (TourAPI `detailCommon`)
- Wikipedia, Kakao Place, Naver 등은 DB 캐싱 자체가 없음

이 spec은 전체 외부 API 호출처를 카테고리화하고 우선순위 있는 개선 계획을 제시함.

## 2. 감사 결과 (18개 호출 사이트)

| 카테고리 | 개수 | 설명 |
|---|---|---|
| **A** | 6 | DB에 데이터 있는데도 외부 호출 (즉시 제거 가능) |
| **B** | 6 | DB 캐싱 자체가 없음 (정적인 정보 → 테이블 신설) |
| **C** | 3 | DB에 있지만 sync가 갱신 안 되거나 메모리만 캐싱 |
| **D** | 3 | 신선도가 중요해 외부 호출 유지 (의도된 동작) |

### 2.1 Category A — Redundant (이미 DB에 있음)

| 호출 위치 | 외부 API | 대상 DB 테이블/컬럼 | 권장 조치 |
|---|---|---|---|
| `destinations.ts:167, 245` (`getDestinationShell`, `getDestinationDetail`) | `tourApi.detailCommon` | `destinations` 모든 필드 일치 | **호출 제거**. row만으로 detail 구성. 또는 `getCachedOrFetch` 만료 시 결과를 row에 upsert |
| `destinations.ts:268-269` | `tourApi.detailIntro`, `detailImage` | `destinations` (컬럼 없음, 추가 필요) | `intro_data` (jsonb) + `image_data` (jsonb) 컬럼 추가 후 upsert |
| `restaurants.ts:89-91` | `tourApi.detailCommon/Intro/Image` | `destinations` (content_type_id='39') | travel과 동일 패턴 |
| `pet-places.ts:69` | `tourApi.detailPetTour` | `pet_friendly_places` (컬럼 없음, 추가 필요) | `pet_tour_data` (jsonb) 컬럼 추가 |
| `destinations.ts:321` | `tourApi.detailPetTour` | 위와 동일 | 위와 동일 |

### 2.2 Category B — Missing cache (DB 캐싱 신설)

| 호출 위치 | 외부 API | 신설할 테이블 | 권장 조치 |
|---|---|---|---|
| `WikiSection.tsx` | Wikipedia API | `wiki_summaries(title PK, extract, thumbnail_url, content_url, lang, cached_at)` | DB 먼저 조회, miss 시 외부 + upsert |
| `KakaoLinkSection.tsx` | Kakao Local Search | `kakao_place_cache(content_id PK, place_url, place_name, cached_at)` | content_id 기반 lookup |
| `TransitSection.tsx` | Kakao 카테고리(SW8) | `transit_stations` 또는 좌표 격자 캐시 | 100m 격자 키 + cached_at |
| `/api/naver/blog` route | Naver Blog Search | `naver_search_cache(query, kind='blog', items_json, cached_at)` | 30분~6시간 TTL |
| `/api/naver/news` route | Naver News Search | 위 테이블, kind='news' | 30분 TTL |
| `/api/naver/local` route | Naver Local Search | 위 테이블, kind='local' | 5~30분 TTL |

### 2.3 Category C — Stale sync / memory-only

| 호출 위치 | 문제 | 권장 조치 |
|---|---|---|
| `nearby-tour-recommendations.ts:109` (`tourApi.locationBasedList`) | `unstable_cache`만 사용, DB 저장 안 됨 | `nearby_tour_cache(lat_rounded, lng_rounded, tour_type, items_json, cached_at)` 신설 |
| `NearbyNaverPlaces.tsx` 클라이언트 fetch | 탭 클릭마다 호출, 클라 캐시 없음 | React Query 또는 SWR로 5~30분 클라 캐시 + 위 `naver_search_cache` 활용 |
| `WeatherWidget` (`weather_cache`) | 정상 작동 중 ✓ | 변경 없음 |

### 2.4 Category D — Fresh by design (유지)

- 메인 페이지의 `MainBlogReviewSection`, `MainTravelNewsSection`, `RegionalRecommendations` — 사용자가 직접 선택한 region+theme 기반 검색 결과. 신선도 중요.
- 위 항목들도 DB 캐싱 레이어 추가 시 자동으로 캐시 히트가 발생하면 효과는 누릴 수 있음 (사용자 선택지가 한정적이므로).

## 3. 우선순위 (Top 5)

### P0 — destinations detailCommon upsert 누락 (Category A)
**가장 큰 영향.** Travel/Restaurant 상세 페이지가 매 요청마다 TourAPI 호출. `destinations` row에 이미 모든 필드가 있음.

**Fix**: `getDestinationShell`/`getDestinationDetail`에서 외부 호출 자체를 제거하거나, 호출 시 결과를 DB에 upsert + `cached_at` 갱신.

**예상 효과**: 상세 페이지 shell 응답에서 외부 TourAPI 호출 1개 완전 제거 (~300~600ms).

### P1 — destinations에 intro/images jsonb 추가 (Category A)
`detailIntro`, `detailImage` 응답을 DB에 저장. sync 스크립트가 정기적으로 갱신.

**예상 효과**: IntroSection 외부 호출 제거 (~400ms 절감), 갤러리 추가 이미지 부활.

### P2 — Wikipedia + Kakao Place 캐시 테이블 신설 (Category B)
거의 안 변하는 정보. 첫 요청 시 외부 호출 + DB 저장, 이후 모든 요청은 DB hit.

**예상 효과**: 각 ~200ms 절감, 외부 API 일일 호출 90%+ 감소.

### P3 — pet_friendly_places에 pet_tour jsonb 추가 (Category A)
`detailPetTour` 결과를 DB에 저장 (현재 PR #36에서 호출 제거됨, 이걸 복원하려면 DB가 source).

### P4 — nearby_tour_cache 테이블 + Naver search 캐시 (Category C/B)
좌표 라운딩 키 + jsonb로 결과 저장. 좌표 기반 검색 성능 + 외부 API 쿼터 절감.

## 4. 공통 패턴 — "DB-First, External-Fallback, Upsert-on-Miss"

모든 외부 API 호출은 다음 4단계로 통일:

```ts
async function getXxx(key) {
  // 1. DB 먼저
  const cached = await selectFromCache(key);
  if (cached && !isExpired(cached)) return cached.data;

  // 2. 외부 호출
  const fresh = await fetchExternal(key);

  // 3. DB에 upsert (cached_at 갱신)
  await upsertCache(key, fresh);

  // 4. 반환
  return fresh;
}
```

기존 `getCachedOrFetch` 헬퍼는 이 패턴을 의도했지만 step 3이 누락되어 있음. 헬퍼를 수정하거나, 각 데이터 함수에서 명시적으로 upsert.

## 5. 단계별 실행 계획

### Phase 1 — Quick wins (별도 PR, 1~2일)
- `destinations.detailCommon` 외부 호출 제거 또는 upsert 추가 (P0)
- `getCachedOrFetch` 헬퍼에 onFresh 콜백 추가하거나 사용처에서 직접 upsert

### Phase 2 — Schema 확장 (PR, 2~3일)
- `destinations` 테이블에 `intro_data`/`image_data` jsonb 컬럼 추가 (migration)
- `pet_friendly_places`에 `pet_tour_data` jsonb 컬럼 추가
- 상세 페이지 IntroSection이 이 컬럼 사용하도록 변경, 만료 시 upsert
- sync 스크립트(`sync-destinations.mjs`)가 이 컬럼도 채우도록 확장

### Phase 3 — 신규 캐시 테이블 (PR, 3~4일)
- `wiki_summaries` migration + DB-first 함수 + 컴포넌트 교체
- `kakao_place_cache` migration + DB-first 함수 + 컴포넌트 교체
- `naver_search_cache` migration + 3개 `/api/naver/*` route가 DB-first로 동작
- `nearby_tour_cache` migration + 좌표 라운딩 키

### Phase 4 — 클라이언트 캐싱 (선택)
- `NearbyNaverPlaces` 등 클라이언트 컴포넌트에 React Query/SWR 도입
- 탭 전환 시 캐시 hit

## 6. 트레이드오프 & 위험

| 항목 | 위험 | 대응 |
|---|---|---|
| jsonb 컬럼 추가 시 row 크기 증가 | destinations 테이블 read 비용 증가 | 필요 시 별도 `destination_extras` 테이블 또는 select 시 필드 명시 |
| 캐시된 데이터 stale | 운영시간/홈페이지 등이 옛날 정보 | sync 스크립트 일일 cron, TTL 만료 시 background refresh |
| 신규 테이블 마이그레이션 비용 | RLS 설정/인덱스 누락 | migration 템플릿 확립 (anyone-read RLS, content_id PK, cached_at idx) |
| 외부 API rate limit | 첫 cold cache 시 동시 호출 폭주 | `unstable_cache`로 동일 요청 dedupe, 또는 sync 스크립트로 사전 워밍 |
| Naver search 캐시 신선도 | 사용자가 최신 후기를 원함 | 짧은 TTL (5분~1시간) + 쿼리 정규화로 hit rate 확보 |

## 7. 미해결 질문

1. **`destinations` row vs 별도 `destination_extras` 테이블** — jsonb를 destinations에 추가할지, 분리할지? 분리하면 listing 쿼리가 가벼워지지만 join 비용.
2. **Naver search 캐시는 query string 기반인데 사용자가 자유 입력 가능** — 인기 query만 캐싱할지, 모든 query 저장할지?
3. **Wikipedia 캐시 invalidation** — 위키 문서가 업데이트되면 어떻게 알 수 있나? 단순 TTL(예: 30일)로 갈지?
4. **상세 페이지 deploy 후 가장 큰 효과는 P0**임이 명확하나, 그 외 순서는 운영 데이터 보고 재조정 가능.

## 8. 다음 단계

- 이 spec 사용자 리뷰
- 승인되면 Phase 1부터 plan 작성 → 실행
- 각 Phase는 독립적 PR로 분리 (스코프 관리 + 검증 용이)
