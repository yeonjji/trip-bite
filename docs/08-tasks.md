# 08-Tasks

> **프로젝트**: 여행한입 (Trip Bite)
> **작성일**: 2026-03-12
> **총 태스크**: 128개 (6 Phase)
> **상태**: 진행 중 (125/128 완료) — Phase 0~5 (P5-01~16) ✅

---

## 의존성 없이 바로 시작 가능한 태스크

| # | 태스크 | Phase |
|---|--------|-------|
| ✅ P0-01 | Next.js 15 + TypeScript + pnpm 초기화 | 0 |
| ✅ P0-18 | Vercel 배포 설정 | 0 |
| ✅ P0-19 | 환경변수 템플릿 (.env.example) | 0 |
| ✅ P1-01 | TourAPI 공통 응답 타입 정의 | 1 |
| ✅ P1-03 | 지역코드 + contentType 상수 정의 | 1 |
| ✅ P1-04 | 캠핑장 타입 정의 | 1 |
| ✅ P1-05 | 특산품 타입 정의 | 1 |
| ✅ P1-06 | 레시피 타입 정의 | 1 |
| ✅ P1-08 | regions 테이블 마이그레이션 + 시드 | 1 |
| ✅ P1-25 | NaverMap 컴포넌트 | 1 |
| ✅ P1-28 | Rating 컴포넌트 | 1 |
| ✅ P5-05 | robots.txt | 5 |
| ✅ P5-06 | OG 이미지 생성 | 5 |
| ✅ P5-10 | CSP 헤더 + 보안 헤더 | 5 |

---

## Phase 0: 프로젝트 부트스트랩 (19개)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P0-01 | Next.js 15 + TypeScript + pnpm 초기화 | - | `package.json`, `tsconfig.json`, `next.config.ts` |
| ✅ P0-02 | Tailwind CSS v4 warm theme 설정 | P0-01 | `globals.css`, CSS 변수, Pretendard + Inter |
| ✅ P0-03 | shadcn/ui 설치 + warm theme | P0-02 | `src/components/ui/*` (Button, Card, Input 등 10종) |
| ✅ P0-04 | next-intl 설정 (locale 라우팅) | P0-01 | `src/i18n/*`, `messages/ko.json`, `messages/en.json` |
| ✅ P0-05 | Supabase 연결 (@supabase/ssr) | P0-01 | `src/lib/supabase/*`, `.env.local` |
| ✅ P0-06 | Supabase 확장 (PostGIS, pg_cron, pg_net) | P0-05 | `supabase/migrations/001_extensions.sql` |
| ✅ P0-07 | 공통 SQL 함수 (updated_at 트리거 + 평점 집계) | P0-06 | `supabase/migrations/002_helper_functions.sql` |
| ✅ P0-08 | next-intl 미들웨어 | P0-04 | `middleware.ts` (locale 감지/리다이렉트) |
| ✅ P0-09 | Supabase 세션 미들웨어 | P0-08, P0-05 | `middleware.ts` (쿠키 기반 세션 갱신) |
| ✅ P0-10 | Header 컴포넌트 | P0-03, P0-04 | `src/components/layout/Header.tsx` |
| ✅ P0-11 | Footer 컴포넌트 | P0-03, P0-04 | `src/components/layout/Footer.tsx` |
| ✅ P0-12 | MobileNav 컴포넌트 | P0-10 | `src/components/layout/MobileNav.tsx` |
| ✅ P0-13 | LanguageSwitcher 컴포넌트 | P0-04 | `src/components/layout/LanguageSwitcher.tsx` |
| ✅ P0-14 | 여행지/맛집/캠핑장 라우트 placeholder | P0-04 | `travel/`, `restaurants/`, `camping/` page.tsx |
| ✅ P0-15 | 특산품/레시피/지역/검색 라우트 placeholder | P0-04 | `specialties/`, `recipes/`, `region/`, `search/` page.tsx |
| ✅ P0-16 | 홈/소개/법적 라우트 placeholder | P0-04 | `page.tsx`, `about/`, `privacy/`, `terms/` |
| ✅ P0-17 | ESLint + Prettier 설정 | P0-01 | `.eslintrc.json`, `.prettierrc` |
| ✅ P0-18 | Vercel 배포 설정 | - | `vercel.json` |
| ✅ P0-19 | 환경변수 템플릿 (.env.example) | - | `.env.example` |

### Phase 0 검증 기준
- `pnpm dev` 로컬 개발 서버 정상 실행
- `/ko`, `/en` 접근 시 올바른 레이아웃 렌더링
- 언어 전환 (KO <-> EN) 정상 동작
- Supabase 연결 확인
- 모든 라우트 placeholder 렌더링 확인
- Header, Footer, MobileNav 반응형 확인

---

## Phase 1: TourAPI + 고캠핑 + 지도 + 여행지/맛집/캠핑장 (50개)

### 1-A. 타입 + 상수 (P1-01 ~ P1-07)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-01 | TourAPI 공통 응답 타입 정의 | - | `src/types/tour-api.ts` (ApiResponse\<T\>, ApiHeader, ApiBody) |
| ✅ P1-02 | TourAPI 여행지/맛집 엔티티 타입 | P1-01 | `src/types/tour-api.ts` (TourSpotBase, RestaurantDetail) |
| ✅ P1-03 | 지역코드 + contentType 상수 정의 | - | `src/lib/constants/area-codes.ts`, `content-types.ts` |
| ✅ P1-04 | 캠핑장 타입 정의 | - | `src/types/camping.ts` (CampingSiteBase, CampingSiteDetail) |
| ✅ P1-05 | 특산품 타입 정의 | - | `src/types/specialty.ts` (Specialty, SpecialtyCategory) |
| ✅ P1-06 | 레시피 타입 정의 | - | `src/types/recipe.ts` (Recipe, RecipeStep, CookRcpApiResponse) |
| ✅ P1-07 | DB 공통 타입 (Supabase Row 타입) | P1-01, P1-04 | `src/types/database.ts` (Database interface) |

### 1-B. DB 마이그레이션 (P1-08 ~ P1-11)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-08 | regions 테이블 마이그레이션 + 시드 | - | `003_regions.sql` (17개 시도 시드) |
| ✅ P1-09 | destinations 테이블 마이그레이션 | P1-08 | `004_destinations.sql` (PostGIS, GIST 인덱스) |
| ✅ P1-10 | camping_sites 테이블 마이그레이션 | P1-08 | `005_camping_sites.sql` (PostGIS) |
| ✅ P1-11 | reviews 테이블 마이그레이션 | P1-09, P1-10 | `008_reviews.sql` (평점 집계 트리거) |

### 1-C. API 클라이언트 (P1-12 ~ P1-17)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-12 | TourApiClient 베이스 클래스 | P1-01, P1-03 | `src/lib/api/tour-api.ts` (fetch\<T\>, 에러 핸들링) |
| ✅ P1-13 | TourApiClient 목록 조회 메서드 | P1-12 | areaBasedList, searchKeyword |
| ✅ P1-14 | TourApiClient 상세 조회 메서드 | P1-12, P1-02 | detailCommon, detailIntro, detailImage |
| ✅ P1-15 | CampingApiClient 베이스 + 목록 | P1-04, P1-03 | `src/lib/api/camping-api.ts` (basedList, searchList) |
| ✅ P1-16 | CampingApiClient 상세 + 이미지 | P1-15 | detailList, imageList |
| ✅ P1-17 | 데이터 캐시 유틸리티 | P1-09 | `src/lib/utils/cache.ts` (isCacheValid, getCachedOrFetch) |

### 1-D. Edge Functions (P1-18 ~ P1-19)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-18 | sync-destinations Edge Function | P1-13, P1-09 | `scripts/sync-destinations.mjs` |
| ✅ P1-19 | sync-camping Edge Function | P1-15, P1-10 | `scripts/sync-camping.mjs` |

### 1-E. UI 컴포넌트 - 카드 (P1-20 ~ P1-22)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-20 | TravelCard 컴포넌트 | P0-03 | `src/components/cards/TravelCard.tsx` |
| ✅ P1-21 | RestaurantCard 컴포넌트 | P0-03 | `src/components/cards/RestaurantCard.tsx` |
| ✅ P1-22 | CampingCard 컴포넌트 | P0-03 | `src/components/cards/CampingCard.tsx` |

### 1-F. UI 컴포넌트 - 필터 (P1-23 ~ P1-24)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-23 | RegionFilter 컴포넌트 | P1-03, P0-03 | `src/components/filters/RegionFilter.tsx` |
| ✅ P1-24 | ThemeFilter 컴포넌트 | P1-03, P0-03 | `src/components/filters/ThemeFilter.tsx` |

### 1-G. UI 컴포넌트 - 지도/공용 (P1-25 ~ P1-31)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-25 | NaverMap 컴포넌트 | - | `src/components/maps/NaverMap.tsx` |
| ✅ P1-26 | MapMarker 컴포넌트 | P1-25 | `src/components/maps/MapMarker.tsx` |
| ✅ P1-27 | ImageGallery 컴포넌트 | P0-03 | `src/components/shared/ImageGallery.tsx` |
| ✅ P1-28 | Rating 컴포넌트 | - | `src/components/shared/Rating.tsx` |
| ✅ P1-29 | Pagination 컴포넌트 | P0-03 | `src/components/shared/Pagination.tsx` |
| ✅ P1-30 | CampingFilter 컴포넌트 | P0-03 | `src/components/filters/CampingFilter.tsx` |
| ✅ P1-31 | EmptyState 컴포넌트 | P0-03 | `src/components/shared/EmptyState.tsx` |

### 1-H. 여행지 페이지 (P1-32 ~ P1-36)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-32 | 여행지 데이터 fetch 유틸 | P1-09, P1-17, P1-07 | `src/lib/data/destinations.ts` |
| ✅ P1-33 | 여행지 목록 페이지 | P1-32, P1-20, P1-23, P1-24, P1-29 | `[locale]/travel/page.tsx` |
| ✅ P1-34 | 여행지 상세 페이지 기본 정보 | P1-32, P1-14, P1-28 | `[locale]/travel/[id]/page.tsx` |
| ✅ P1-35 | 여행지 상세 지도 + 갤러리 섹션 | P1-34, P1-25, P1-26, P1-27 | 지도+이미지 통합 |
| ✅ P1-36 | 여행지 SEO 메타데이터 | P1-34 | generateMetadata + OG tags |

### 1-I. 맛집 페이지 (P1-37 ~ P1-39)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-37 | 맛집 데이터 fetch 유틸 | P1-32 | `src/lib/data/restaurants.ts` |
| ✅ P1-38 | 맛집 목록 페이지 | P1-37, P1-21, P1-23, P1-29 | `[locale]/restaurants/page.tsx` |
| ✅ P1-39 | 맛집 상세 페이지 | P1-37, P1-14, P1-25, P1-27, P1-28 | `[locale]/restaurants/[id]/page.tsx` |

### 1-J. 캠핑장 페이지 (P1-40 ~ P1-43)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-40 | 캠핑장 데이터 fetch 유틸 | P1-10, P1-17, P1-07 | `src/lib/data/camping.ts` |
| ✅ P1-41 | 캠핑장 목록 페이지 | P1-40, P1-22, P1-23, P1-30, P1-29 | `[locale]/camping/page.tsx` |
| ✅ P1-42 | 캠핑장 상세 페이지 기본 정보 | P1-40, P1-16 | `[locale]/camping/[id]/page.tsx` |
| ✅ P1-43 | 캠핑장 상세 지도 + 이미지 + SEO | P1-42, P1-25, P1-27, P1-28 | 지도+이미지+메타데이터 |

### 1-K. 리뷰 시스템 (P1-44 ~ P1-47)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-44 | ReviewForm 컴포넌트 | P1-28, P0-03 | `src/components/reviews/ReviewForm.tsx` |
| ✅ P1-45 | ReviewList 컴포넌트 | P1-28 | `src/components/reviews/ReviewList.tsx` |
| ✅ P1-46 | 리뷰 API Route | P1-11 | `src/app/api/reviews/route.ts` |
| ✅ P1-47 | 리뷰 섹션 상세 페이지 통합 | P1-44, P1-45, P1-46, P1-35, P1-39, P1-43 | 3개 상세 페이지에 리뷰 추가 |

### 1-L. 통합 검색 (P1-48 ~ P1-50)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P1-48 | SearchBar 컴포넌트 | P0-03 | `src/components/search/SearchBar.tsx` |
| ✅ P1-49 | 검색 API Route | P1-09, P1-10 | `src/app/api/search/route.ts` |
| ✅ P1-50 | 검색 결과 페이지 | P1-49, P1-48, P1-20, P1-21, P1-22, P1-31 | `[locale]/search/page.tsx` |

### Phase 1 검증 기준
- TourAPI 실제 데이터로 여행지/맛집 목록 로딩
- 지역/테마 필터, 정렬, 페이지네이션 정상 동작
- 여행지/맛집 상세: 이미지, 설명, 주소, 전화, 지도 마커
- 고캠핑 API 캠핑장 목록/상세 로딩
- 캠핑장 업종/시설/반려동물 필터
- 리뷰 작성/조회 + 평점 집계
- 키워드 통합 검색
- 반응형 레이아웃 (모바일/태블릿/데스크톱)
- 24시간 캐시 로직 동작

---

## Phase 2: 특산품 + 레시피 (14개)

### 2-A. DB + API + 시드 (P2-01 ~ P2-05)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P2-01 | specialties 테이블 마이그레이션 | P1-08 | `006_specialties.sql` |
| ✅ P2-02 | recipes 테이블 마이그레이션 | P2-01 | `007_recipes.sql` |
| ✅ P2-03 | RecipeApiClient 구현 | P1-06 | `src/lib/api/recipe-api.ts` |
| ✅ P2-04 | 특산품 시드 데이터 | P2-01 | `supabase/seed-specialties.sql` (60개) |
| ✅ P2-05 | sync-recipes Edge Function | P2-03, P2-02 | `supabase/functions/sync-recipes/` |

### 2-B. UI 컴포넌트 (P2-06 ~ P2-07)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P2-06 | SpecialtyCard 컴포넌트 | P0-03 | `src/components/cards/SpecialtyCard.tsx` |
| ✅ P2-07 | RecipeCard 컴포넌트 | P0-03 | `src/components/cards/RecipeCard.tsx` |

### 2-C. 특산품 페이지 (P2-08 ~ P2-10)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P2-08 | 특산품 데이터 fetch 유틸 | P2-01, P1-07 | `src/lib/data/specialties.ts` |
| ✅ P2-09 | 특산품 목록 페이지 | P2-08, P2-06, P1-23, P1-29 | `[locale]/specialties/page.tsx` |
| ✅ P2-10 | 특산품 상세 페이지 | P2-08, P2-07 | `[locale]/specialties/[id]/page.tsx` |

### 2-D. 레시피 페이지 (P2-11 ~ P2-14)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P2-11 | 레시피 데이터 fetch 유틸 | P2-02, P1-07 | `src/lib/data/recipes.ts` |
| ✅ P2-12 | 레시피 목록 페이지 | P2-11, P2-07, P1-29 | `[locale]/recipes/page.tsx` |
| ✅ P2-13 | 레시피 상세 페이지 | P2-11 | `[locale]/recipes/[id]/page.tsx` |
| ✅ P2-14 | 레시피 JSON-LD 구조화 데이터 | P2-13 | Schema.org Recipe markup |

### Phase 2 검증 기준
- COOKRCP01 API 레시피 데이터 정상 로딩
- 특산품 지역/카테고리/제철 필터 동작
- 특산품 상세 -> 연결 레시피 탐색
- 레시피 단계별 조리법 + 이미지 + 영양정보
- Recipe JSON-LD 유효성 (Google Rich Results Test)

---

## Phase 3: 접근성 정보 + 대상별 필터 (7개)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P3-01 | accessibility_info 테이블 마이그레이션 | P1-09 | `010_accessibility_info.sql` |
| ✅ P3-02 | TourAPI detailPetTour 연동 | P1-14 | tour-api.ts detailPetTour 메서드 |
| ✅ P3-03 | TourAPI detailWithTour 연동 | P1-14 | tour-api.ts detailWithTour 메서드 |
| ✅ P3-04 | sync-accessibility Edge Function | P3-01, P3-02, P3-03 | `supabase/functions/sync-accessibility/` |
| ✅ P3-05 | AccessibilityBadge 컴포넌트 | P0-03 | `src/components/shared/AccessibilityBadge.tsx` |
| ✅ P3-06 | TargetGroupFilter 컴포넌트 | P0-03 | `src/components/filters/TargetGroupFilter.tsx` |
| ✅ P3-07 | 접근성 상세 섹션 + 카드 배지 통합 | P3-04, P3-05, P3-06, P1-35, P1-33 | 상세+목록 페이지 수정 |

### Phase 3 검증 기준
- 반려동물 동반/휠체어/외국인 친화 필터 동작
- 상세 페이지에 접근성 상세 정보 표시
- 카드에 접근성 배지 아이콘 표시
- 필터 조합 (복수 선택) 정상 동작

---

## Phase 4: 날씨 + 지역 허브 + 홈페이지 완성 (19개)

### 4-A. 날씨 API (P4-01 ~ P4-05)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P4-01 | weather_cache 테이블 마이그레이션 | P1-08 | `009_weather_cache.sql` |
| ✅ P4-02 | 격자좌표 매핑 상수 | P1-03 | `src/lib/constants/grid-coords.ts` |
| ✅ P4-03 | WeatherApiClient 구현 | P4-02 | `src/lib/api/weather-api.ts` |
| ✅ P4-04 | 날씨 캐시 + 동기화 로직 | P4-01, P4-03 | `src/lib/data/weather.ts` (3시간 캐시) |
| ✅ P4-05 | WeatherWidget 컴포넌트 | P4-04 | `src/components/weather/WeatherWidget.tsx` |

### 4-B. 지도 + 추천 (P4-06 ~ P4-09)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P4-06 | KoreaMapSvg 컴포넌트 | P1-03 | `src/components/maps/KoreaMapSvg.tsx` |
| ✅ P4-07 | 여행지 상세 날씨 위젯 추가 | P4-05, P1-35 | travel/[id] 날씨 표시 |
| ✅ P4-08 | 계절별 추천 로직 | P1-32, P4-04 | `src/lib/utils/recommendation.ts` |
| ✅ P4-09 | 지역 허브 페이지 | P4-05, P1-32, P1-37, P1-40, P2-08 | `[locale]/region/[areaCode]/page.tsx` |

### 4-C. 홈페이지 섹션 (P4-10 ~ P4-14)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P4-10 | 홈 히어로 섹션 | P1-48 | 배경 이미지 + SearchBar + 인기 검색어 |
| ✅ P4-11 | 홈 추천 여행지 캐러셀 | P4-10, P1-20, P4-08 | TravelCard 수평 캐러셀 |
| ✅ P4-12 | 홈 인기 지역 그리드 | P4-10, P4-06 | SVG 지도 + 지역 카드 |
| ✅ P4-13 | 홈 제철 특산품 섹션 | P4-10, P2-06, P2-08 | SpecialtyCard 스크롤 |
| ✅ P4-14 | 홈 날씨별 추천 + 최신 레시피 + 추천 캠핑장 | P4-10, P4-08, P2-07, P2-11, P1-22, P1-40 | 3개 섹션 |

### 4-D. UX + 스케줄 (P4-15 ~ P4-19)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P4-15 | 로딩 스켈레톤 - 목록 페이지 | P0-03 | 5개 목록 `loading.tsx` |
| ✅ P4-16 | 로딩 스켈레톤 - 상세 페이지 | P0-03 | 3개 상세 `loading.tsx` |
| ✅ P4-17 | 로딩 스켈레톤 - 홈 + 지역 허브 | P0-03 | 홈/지역 `loading.tsx` |
| ✅ P4-18 | 이미지 최적화 | P4-14 | next/image sizes, remotePatterns, lazy |
| ✅ P4-19 | pg_cron 스케줄 설정 | P1-18, P1-19, P2-05, P3-04, P4-04 | `012_cron_jobs.sql` |

### Phase 4 검증 기준
- 홈 -> 지역 허브 -> 상세 전체 플로우
- SVG 한국 지도 클릭 -> 지역 허브 이동
- 지역 허브에 여행지/맛집/특산품/날씨 표시
- 날씨 위젯 3일 예보 표시
- 홈페이지 7개 섹션 렌더링
- 로딩 스켈레톤 동작
- 이미지 lazy loading 동작

---

## Phase 5: 영어 번역 + SEO + 프로덕션 (19개)

### 5-A. 번역 (P5-01 ~ P5-03)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P5-01 | ko.json UI 문자열 완성 | P4-14 | 모든 UI를 t() 사용 |
| ✅ P5-02 | en.json 영어 번역 | P5-01 | `messages/en.json` 완성 |
| ✅ P5-03 | 지역명/카테고리/접근성 라벨 영어 번역 | P5-02 | 상수 + DB en 필드 |

### 5-B. SEO (P5-04 ~ P5-06)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P5-04 | sitemap.xml 동적 생성 | P5-02 | `src/app/sitemap.ts` |
| ✅ P5-05 | robots.txt | - | `src/app/robots.ts` |
| ✅ P5-06 | OG 이미지 생성 | - | `src/app/opengraph-image.tsx` |

### 5-C. 에러 + 보안 (P5-07 ~ P5-10)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P5-07 | 에러 페이지 (404, 500) i18n | P5-02 | `not-found.tsx`, `error.tsx`, `global-error.tsx` |
| ✅ P5-08 | RLS 정책 설정 | P1-11 | `013_rls_policies.sql` |
| ✅ P5-09 | API Route rate limiting | P1-46 | `src/lib/utils/rate-limit.ts` |
| ✅ P5-10 | CSP 헤더 + 보안 헤더 | - | `next.config.ts` headers |

### 5-D. 법적 페이지 (P5-11 ~ P5-13)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P5-11 | 개인정보처리방침 페이지 | P5-02 | `[locale]/privacy/page.tsx` |
| ✅ P5-12 | 이용약관 페이지 | P5-02 | `[locale]/terms/page.tsx` |
| ✅ P5-13 | 서비스 소개 페이지 | P5-02 | `[locale]/about/page.tsx` |

### 5-E. 프로덕션 배포 (P5-14 ~ P5-19)

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| ✅ P5-14 | hreflang 태그 검증 | P5-04 | 전체 페이지 hreflang 확인 |
| ✅ P5-15 | Lighthouse 감사 + 성능 최적화 | P5-04, P5-10, P4-18 | Lighthouse 90+ |
| ✅ P5-16 | 프로덕션 환경 변수 설정 | P0-18 | Vercel Env Variables |
| P5-17 | 프로덕션 도메인 연결 | P5-16 | DNS + HTTPS |
| P5-18 | Google Search Console 등록 + sitemap 제출 | P5-17, P5-04 | GSC 등록 완료 |
| P5-19 | 최종 QA 체크리스트 | P5-15, P5-11, P5-12, P5-13, P5-08, P5-09 | QA 전체 통과 |

### Phase 5 검증 기준
- Lighthouse Performance/Accessibility/Best Practices/SEO 모두 90+
- /en 전체 페이지 영어 렌더링 (누락 번역 0)
- sitemap.xml 유효, robots.txt 정상
- OG 이미지 소셜 공유 미리보기
- RLS: 비인증 사용자 쓰기 차단
- Rate limiting: 과다 요청 시 429 응답
- 프로덕션 도메인 HTTPS 정상
- 모바일/태블릿/데스크톱 반응형
- 법적 페이지 접근 가능
- GSC 소유권 확인 + sitemap 제출
- Rich Results Test 통과

---

## 병렬 실행 가능 구간

```
Phase 0 완료 후:
  ├── Phase 1 타입/상수 (P1-01~07) ── 병렬 가능
  ├── Phase 1 DB (P1-08~11)
  └── Phase 1 UI 컴포넌트 (P1-20~31) ── 병렬 가능

Phase 1 완료 후:
  ├── Phase 2 (특산품/레시피) ── 병렬 가능
  ├── Phase 3 (접근성) ────────── 병렬 가능
  └── Phase 4 날씨 (P4-01~05) ── 병렬 가능

Phase 2+3 완료 후:
  └── Phase 4 지역 허브 + 홈 (P4-09~14)

Phase 4 완료 후:
  └── Phase 5 (번역 + SEO + 프로덕션)
```

### 주요 병렬 포인트
- **P1-20~P1-31**: UI 컴포넌트 12개 동시 진행 가능
- **P2-01 + P3-01 + P4-01**: Phase 1 DB 완료 후 3개 DB 작업 병렬
- **P2-06~07 + P3-05~06**: UI 컴포넌트 병렬
- **P5-05 + P5-06 + P5-10**: 의존성 없는 Phase 5 태스크 병렬
- **P5-11 + P5-12 + P5-13**: 법적 페이지 3개 병렬

---

## 일정 요약

| Phase | 기간 | 태스크 수 | 주요 산출물 |
|-------|------|----------|-----------|
| Phase 0 | Day 1-2 | 19개 | 프로젝트 기반, 레이아웃, 라우트 |
| Phase 1 | Day 3-10 | 50개 | 여행지/맛집/캠핑장 탐색, 지도, 리뷰, 검색 |
| Phase 2 | Day 10-13 | 14개 | 특산품, 레시피, JSON-LD |
| Phase 3 | Day 14-16 | 7개 | 접근성 정보, 대상별 필터 |
| Phase 4 | Day 17-20 | 19개 | 날씨, 지역 허브, 홈페이지 |
| Phase 5 | Day 21-25 | 19개 | 영어 번역, SEO, 프로덕션 배포 |
| **Total** | **25일** | **128개** | **MVP 완성** |
