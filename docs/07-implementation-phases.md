# 07-Implementation Phases

> **프로젝트**: 여행한입 (Trip Bite)
> **작성일**: 2026-03-11
> **버전**: 1.0

---

## Phase 0: 프로젝트 부트스트랩 (Day 1-2)

### 목표
프로젝트 기반 인프라를 구축하고, 모든 라우트의 placeholder를 생성하여 개발 준비를 완료한다.

### 태스크

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| 0-1 | Next.js 15 + TypeScript + pnpm 초기화 | - | `package.json`, `tsconfig.json`, `next.config.ts` |
| 0-2 | Tailwind CSS v4 설정 + warm theme 커스터마이징 | 0-1 | `src/app/globals.css`, CSS 변수 |
| 0-3 | shadcn/ui 설치 + warm theme 커스터마이징 | 0-2 | `src/components/ui/*` |
| 0-4 | next-intl 설정 (`[locale]` 라우팅, ko/en) | 0-1 | `src/i18n/*`, `messages/ko.json`, `messages/en.json` |
| 0-5 | Supabase 프로젝트 생성 + `@supabase/ssr` 연결 | 0-1 | `src/lib/supabase/*`, `.env.local` |
| 0-6 | Supabase 확장 준비 (`PostGIS`, `pg_cron`, `pg_net`) | 0-5 | `supabase/migrations/001_extensions.sql` |
| 0-7 | 공통 SQL 함수 준비 (`update_updated_at`, 평점 집계 헬퍼) | 0-6 | `supabase/migrations/002_helper_functions.sql` |
| 0-8 | middleware.ts (next-intl + Supabase 세션) | 0-4, 0-5 | `middleware.ts` |
| 0-9 | Layout 컴포넌트 (Header, Footer, MobileNav) | 0-3, 0-4 | `src/components/layout/*` |
| 0-10 | 모든 라우트 placeholder 생성 | 0-4 | `src/app/[locale]/**/*.tsx` |
| 0-11 | ESLint + Prettier 설정 | 0-1 | `.eslintrc.json`, `.prettierrc` |
| 0-12 | Vercel 배포 설정 + 환경 변수 | 0-1 | Vercel 프로젝트 |
| 0-13 | `.env.example` 작성 | 0-5 | `.env.example` |

### 검증 기준
- [ ] `pnpm dev` 로 로컬 개발 서버 정상 실행
- [ ] `/` (한국어)와 `/en` (영어) 접근 시 올바른 레이아웃 렌더링
- [ ] 언어 전환 (KO ↔ EN) 정상 동작
- [ ] Supabase 연결 확인 (콘솔 로그)
- [ ] 모든 라우트 placeholder 렌더링 확인
- [ ] Vercel Preview 배포 정상 동작
- [ ] Header, Footer, MobileNav 반응형 레이아웃 확인

---

## Phase 1: TourAPI + 고캠핑 + 지도 + 여행지/맛집/캠핑장 (Day 3-10)

### 목표
TourAPI와 고캠핑 API 연동, 지도 통합을 완료하여 여행지/맛집/캠핑장의 탐색, 검색, 상세 보기 기능을 구현한다.

### 태스크

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| 1-1 | TourAPI 키 발급 (data.go.kr) | - | API 키 |
| 1-2 | 네이버 지도 API 키 발급 (Naver Cloud Platform) | - | Client ID |
| 1-3 | 카카오 지도 API 키 발급 (Kakao Developers) | - | App Key |
| 1-4 | `TourApiClient` 구현 (10+ 엔드포인트) | 1-1 | `src/lib/api/tour-api.ts` |
| 1-5 | TourAPI TypeScript 타입 정의 | - | `src/types/tour-api.ts` |
| 1-6 | `regions` 테이블 마이그레이션 + 시드 | Phase 0 | `supabase/migrations/003_regions.sql` |
| 1-7 | `destinations` 테이블 마이그레이션 | 1-6 | `supabase/migrations/004_destinations.sql` |
| 1-8 | `reviews` 테이블 마이그레이션 | 1-7 | `supabase/migrations/008_reviews.sql` |
| 1-9 | 초기 데이터 시드 Edge Function | 1-4, 1-7 | `supabase/functions/sync-destinations/` |
| 1-10 | 네이버 지도 컴포넌트 (`NaverMap`, `MapMarker`) | 1-2 | `src/components/maps/*` |
| 1-11 | TravelCard, RestaurantCard 컴포넌트 | Phase 0 | `src/components/cards/*` |
| 1-12 | RegionFilter, ThemeFilter 컴포넌트 | Phase 0 | `src/components/filters/*` |
| 1-13 | 여행지 목록 페이지 (필터, 정렬, 페이지네이션) | 1-7, 1-11, 1-12 | `src/app/[locale]/travel/page.tsx` |
| 1-14 | 여행지 상세 페이지 (정보 + 지도 + 이미지) | 1-4, 1-10 | `src/app/[locale]/travel/[id]/page.tsx` |
| 1-15 | 맛집 목록 페이지 | 1-13 (구조 공유) | `src/app/[locale]/restaurants/page.tsx` |
| 1-16 | 맛집 상세 페이지 | 1-14 (구조 공유) | `src/app/[locale]/restaurants/[id]/page.tsx` |
| 1-17 | ImageGallery 컴포넌트 | Phase 0 | `src/components/shared/ImageGallery.tsx` |
| 1-18 | 자체 리뷰/평점 시스템 (UI + API) | 1-8, 1-27 | Review 컴포넌트 + API Route |
| 1-19 | Rating 컴포넌트 | Phase 0 | `src/components/shared/Rating.tsx` |
| 1-20 | 검색 기능 (TourAPI + 고캠핑 키워드 검색 프록시) | 1-4, 1-25 | `src/app/[locale]/search/page.tsx`, API Route |
| 1-21 | SEO 메타데이터 (여행지/맛집) | 1-14, 1-16 | `generateMetadata` 함수 |
| 1-22 | 지역 코드 + contentType 상수 정의 | - | `src/lib/constants/*` |
| 1-23 | 데이터 캐시 유틸리티 (Supabase 캐시 조회/갱신) | 1-7 | `src/lib/utils/cache.ts` |
| 1-24 | 고캠핑 API 키 발급 (data.go.kr) | - | API 키 |
| 1-25 | `CampingApiClient` 구현 (basedList, searchList, locationBasedList, imageList) | 1-24 | `src/lib/api/camping-api.ts` |
| 1-26 | 캠핑장 TypeScript 타입 정의 | - | `src/types/camping.ts` |
| 1-27 | `camping_sites` 테이블 마이그레이션 + 캠핑 평점 집계 확장 | 1-6 | `supabase/migrations/005_camping_sites.sql` |
| 1-28 | 캠핑장 데이터 시드 Edge Function | 1-25, 1-27 | `supabase/functions/sync-camping/` |
| 1-29 | CampingCard 컴포넌트 | Phase 0 | `src/components/cards/CampingCard.tsx` |
| 1-30 | CampingFilter 컴포넌트 (업종, 시설, 반려동물, 바닥) | Phase 0 | `src/components/filters/CampingFilter.tsx` |
| 1-31 | 캠핑장 목록 페이지 (필터, 정렬, 페이지네이션) | 1-27, 1-29, 1-30 | `src/app/[locale]/camping/page.tsx` |
| 1-32 | 캠핑장 상세 페이지 (시설 + 사이트 현황 + 운영 정보 + 지도) | 1-25, 1-10 | `src/app/[locale]/camping/[id]/page.tsx` |
| 1-33 | 캠핑장 이미지 갤러리 연동 | 1-25, 1-17 | 캠핑장 상세 이미지 |
| 1-34 | SEO 메타데이터 (캠핑장) | 1-32 | `generateMetadata` 함수 |

### 검증 기준
- [ ] TourAPI 실제 데이터로 여행지 목록 로딩 확인
- [ ] 지역 필터, 테마 필터 정상 동작
- [ ] 여행지 상세 페이지에 모든 정보 표시 (이미지, 설명, 주소, 전화)
- [ ] 네이버 지도에 여행지 위치 마커 표시
- [ ] 맛집 목록/상세 정상 동작
- [ ] 키워드 검색 결과 표시
- [ ] 리뷰 작성/조회 정상 동작
- [ ] 반응형 레이아웃 (모바일/태블릿/데스크톱) 확인
- [ ] 24시간 캐시 로직 동작 확인
- [ ] 고캠핑 API 실제 데이터로 캠핑장 목록 로딩 확인
- [ ] 캠핑장 업종 필터, 시설 필터, 반려동물 필터 정상 동작
- [ ] 캠핑장 상세 페이지에 시설 정보, 사이트 현황, 운영 정보 표시
- [ ] 캠핑장 위치 네이버 지도 표시
- [ ] 캠핑장 24시간 캐시 로직 동작 확인

---

## Phase 2: 특산품 + 레시피 (Day 10-13)

### 목표
식약처 레시피 API 연동과 특산품 데이터를 통합하여 특산품 탐색 및 레시피 조회 기능을 완성한다.

### 태스크

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| 2-1 | COOKRCP01 API 키 발급 (식품안전나라) | - | API 키 |
| 2-2 | `specialties` 테이블 마이그레이션 | Phase 0 | `supabase/migrations/006_specialties.sql` |
| 2-3 | `recipes` 테이블 마이그레이션 | 2-2 | `supabase/migrations/007_recipes.sql` |
| 2-4 | `RecipeApiClient` 구현 | 2-1 | `src/lib/api/recipe-api.ts` |
| 2-5 | 레시피 데이터 동기화 Edge Function | 2-3, 2-4 | `supabase/functions/sync-recipes/` |
| 2-6 | 특산품 시드 데이터 작성 | 2-2 | `supabase/seed.sql` (specialties 부분) |
| 2-7 | 특산품-레시피 연결 시드 데이터 | 2-3, 2-6 | specialty_id FK 매핑 |
| 2-8 | SpecialtyCard 컴포넌트 | Phase 0 | `src/components/cards/SpecialtyCard.tsx` |
| 2-9 | RecipeCard 컴포넌트 | Phase 0 | `src/components/cards/RecipeCard.tsx` |
| 2-10 | 특산품 목록 페이지 (지역/카테고리/제철 필터) | 2-2, 2-8 | `src/app/[locale]/specialties/page.tsx` |
| 2-11 | 특산품 상세 페이지 (연결 레시피 포함) | 2-7, 2-10 | `src/app/[locale]/specialties/[id]/page.tsx` |
| 2-12 | 레시피 목록 페이지 | 2-3, 2-9 | `src/app/[locale]/recipes/page.tsx` |
| 2-13 | 레시피 상세 페이지 (단계별 표시) | 2-3 | `src/app/[locale]/recipes/[id]/page.tsx` |
| 2-14 | Recipe JSON-LD 구조화 데이터 | 2-13 | Schema.org Recipe markup |
| 2-15 | 특산품/레시피 TypeScript 타입 | - | `src/types/specialty.ts`, `recipe.ts` |
| 2-16 | SEO 메타데이터 (특산품/레시피) | 2-11, 2-13 | `generateMetadata` 함수 |

### 검증 기준
- [ ] COOKRCP01 API에서 레시피 데이터 정상 로딩
- [ ] 특산품 목록 페이지 (지역/카테고리/제철 필터) 정상 동작
- [ ] 특산품 상세 → 연결 레시피 탐색 가능
- [ ] 레시피 상세 페이지에서 단계별 조리법 + 이미지 표시
- [ ] 레시피 영양 정보 (칼로리, 탄수화물 등) 표시
- [ ] Recipe JSON-LD 구조화 데이터 유효성 (Google Rich Results Test)

---

## Phase 3: 접근성 정보 + 대상별 필터 (Day 14-16)

### 목표
TourAPI의 반려동물/무장애 정보를 연동하여 대상별 접근성 정보를 제공하고 필터링 기능을 완성한다.

### 태스크

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| 3-1 | `accessibility_info` 테이블 마이그레이션 | Phase 1 | `supabase/migrations/010_accessibility_info.sql` |
| 3-2 | TourAPI `detailPetTour1` 연동 + 데이터 저장 | Phase 1 | tour-api.ts 확장 |
| 3-3 | TourAPI `detailWithTour1` 연동 + 데이터 저장 | Phase 1 | tour-api.ts 확장 |
| 3-4 | 접근성 데이터 동기화 Edge Function | 3-1, 3-2, 3-3 | `supabase/functions/sync-accessibility/` |
| 3-5 | AccessibilityBadge 컴포넌트 | Phase 0 | `src/components/shared/AccessibilityBadge.tsx` |
| 3-6 | TargetGroupFilter 컴포넌트 | Phase 0 | `src/components/filters/TargetGroupFilter.tsx` |
| 3-7 | destinations.accessibility JSONB 갱신 로직 | 3-4 | 캐시 갱신 로직 |
| 3-8 | 여행지/맛집 상세 페이지에 접근성 정보 섹션 추가 | 3-1, 3-5 | 상세 페이지 수정 |
| 3-9 | 여행지/맛집 목록 페이지에 대상별 필터 추가 | 3-6, 3-7 | 목록 페이지 수정 |
| 3-10 | 카드 컴포넌트에 접근성 배지 추가 | 3-5 | 카드 컴포넌트 수정 |
| 3-11 | 외국인 친화 마커 데이터 (영어 메뉴, 다국어 직원) | 3-1 | 시드 데이터 |

### 검증 기준
- [ ] 반려동물 동반 필터 적용 시 해당 장소만 표시
- [ ] 휠체어 접근성 필터 정상 동작
- [ ] 외국인 친화 필터 정상 동작
- [ ] 상세 페이지에 대상별 접근성 상세 정보 표시
- [ ] 카드에 접근성 배지 아이콘 표시
- [ ] 필터 조합 (복수 선택) 정상 동작

---

## Phase 4: 날씨 + 지역 허브 + 홈페이지 완성 (Day 17-20)

### 목표
기상청 API 연동, 지역 허브 페이지, 홈페이지를 완성하여 전체 사용자 플로우를 완성한다.

### 태스크

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| 4-1 | 기상청 단기예보 API 키 발급 (data.go.kr) | - | API 키 |
| 4-2 | `weather_cache` 테이블 마이그레이션 | Phase 0 | `supabase/migrations/009_weather_cache.sql` |
| 4-3 | 격자좌표 매핑 상수 정의 | - | `src/lib/constants/grid-coords.ts` |
| 4-4 | `WeatherApiClient` 구현 (초단기+단기예보) | 4-1, 4-3 | `src/lib/api/weather-api.ts` |
| 4-5 | 날씨 데이터 동기화 (3시간 캐시) | 4-2, 4-4 | 캐시 로직 |
| 4-6 | WeatherWidget 컴포넌트 (지역 대표 날씨 + 3일 예보) | 4-4 | `src/components/weather/WeatherWidget.tsx` |
| 4-7 | 여행지 상세 페이지에 날씨 위젯 추가 | 4-6 | 상세 페이지 수정 |
| 4-8 | SVG 한국 지도 컴포넌트 (지역 클릭) | Phase 0 | `src/components/maps/KoreaMapSvg.tsx` |
| 4-9 | 지역 허브 페이지 (여행지+맛집+특산품+날씨) | 4-6, 4-8, Phase 1~3 | `src/app/[locale]/region/[areaCode]/page.tsx` |
| 4-10 | 계절별/날씨 기반 여행지 추천 로직 | 4-5 | `src/lib/utils/recommendation.ts` |
| 4-11 | 홈 히어로 섹션 (검색바 + 인기 검색어) | Phase 1 | 홈페이지 수정 |
| 4-12 | 홈 추천 여행지 캐러셀 | Phase 1 | 홈페이지 수정 |
| 4-13 | 홈 인기 지역 그리드 (SVG 지도 포함) | 4-8 | 홈페이지 수정 |
| 4-14 | 홈 제철 특산품 섹션 | Phase 2 | 홈페이지 수정 |
| 4-15 | 홈 오늘의 날씨별 추천 섹션 | 4-6, 4-10 | 홈페이지 수정 |
| 4-16 | 홈 최신 레시피 섹션 | Phase 2 | 홈페이지 수정 |
| 4-17 | 지역 허브에 "인기 캠핑장" 섹션 추가 | Phase 1 | 지역 허브 수정 |
| 4-18 | 홈 "추천 캠핑장" 섹션 추가 | Phase 1 | 홈페이지 수정 |
| 4-19 | 로딩 스켈레톤 UI (모든 페이지) | Phase 0 | `loading.tsx` 파일들 |
| 4-20 | EmptyState 컴포넌트 (빈 결과) | Phase 0 | `src/components/shared/EmptyState.tsx` |
| 4-21 | 이미지 최적화 (next/image, lazy loading) | - | 전체 이미지 컴포넌트 |
| 4-22 | Prefetching + 성능 최적화 | - | 전반적 성능 튜닝 |
| 4-23 | pg_cron 스케줄 설정 (데이터+날씨 갱신) | 4-5, Phase 1 | `supabase/migrations/012_cron_jobs.sql` |

### 검증 기준
- [ ] 홈 → 지역 허브 → 여행지 상세까지 전체 플로우 정상 동작
- [ ] SVG 한국 지도에서 지역 클릭 시 해당 지역 허브 이동
- [ ] 지역 허브에 여행지, 맛집, 특산품, 날씨 정보 표시
- [ ] 날씨 위젯에 지역 대표 날씨 + 3일 예보 표시
- [ ] 계절별 추천 여행지 정상 동작
- [ ] 홈페이지 모든 섹션 정상 렌더링
- [ ] 로딩 스켈레톤 정상 표시
- [ ] 빈 상태 UI 정상 표시
- [ ] 이미지 lazy loading 동작 확인

---

## Phase 5: 영어 번역 + SEO + 프로덕션 (Day 21-25)

### 목표
영어 번역을 완성하고, SEO 최적화, 보안 정책, 프로덕션 배포를 완료한다.

### 태스크

| # | 태스크 | 의존성 | 산출물 |
|---|--------|--------|--------|
| 5-1 | `messages/en.json` 전체 UI 문자열 번역 | Phase 0~4 | `messages/en.json` 완성 |
| 5-2 | 지역명, 카테고리, 접근성 라벨 영어 번역 | 5-1 | 번역 데이터 |
| 5-3 | 콘텐츠 영어 번역 (title_en, overview_en 등) | 5-1 | DB 데이터 갱신 |
| 5-4 | sitemap.xml 동적 생성 | Phase 4 | `src/app/sitemap.ts` |
| 5-5 | robots.txt | - | `public/robots.txt` |
| 5-6 | OG 이미지 생성 (정적 + 동적) | Phase 4 | `src/app/api/og/route.tsx` |
| 5-7 | hreflang 태그 확인 | Phase 0 | 메타데이터 검증 |
| 5-8 | Lighthouse 감사 + 성능 최적화 | Phase 4 | Lighthouse 리포트 |
| 5-9 | 에러 페이지 (404, 500) i18n | 5-1 | `not-found.tsx`, `error.tsx` |
| 5-10 | Supabase RLS 정책 설정 | Phase 1~3 | `supabase/migrations/011_rls_policies.sql` |
| 5-11 | API Route rate limiting | Phase 1 | 미들웨어 추가 |
| 5-12 | Content Security Policy 헤더 | - | `next.config.ts` 수정 |
| 5-13 | 프로덕션 환경 변수 설정 (Vercel) | Phase 0 | Vercel Env Variables |
| 5-14 | 프로덕션 도메인 연결 | 5-13 | DNS 설정 |
| 5-15 | 개인정보처리방침 페이지 (Privacy Policy) | 5-1 | `src/app/[locale]/privacy/page.tsx` |
| 5-16 | 이용약관 페이지 (Terms of Service) | 5-1 | `src/app/[locale]/terms/page.tsx` |
| 5-17 | 서비스 소개 페이지 (About + 연락처) | 5-1 | `src/app/[locale]/about/page.tsx` |
| 5-18 | Google Search Console 소유권 확인 + sitemap 제출 | 5-4, 5-14 | Search Console 등록 |
| 5-19 | 색인 요청 (주요 페이지 우선 색인) | 5-18 | 색인 상태 확인 |
| 5-20 | Rich Results 테스트 (Recipe, Campground, Restaurant 스키마 검증) | 5-4 | Google Rich Results Test 통과 |
| 5-21 | 최종 QA (전체 페이지 + 기능 체크) | 5-1~5-20 | QA 체크리스트 |

### 검증 기준
- [ ] Lighthouse Performance >90
- [ ] Lighthouse Accessibility >95
- [ ] Lighthouse Best Practices >90
- [ ] Lighthouse SEO >95
- [ ] 영어 UI 전체 페이지 정상 렌더링 (누락 번역 없음)
- [ ] sitemap.xml 유효성 확인
- [ ] robots.txt 정상 동작
- [ ] OG 이미지 소셜 공유 미리보기 확인
- [ ] RLS 정책: 비인증 사용자 쓰기 차단 확인
- [ ] Rate limiting: 과다 요청 시 429 응답 확인
- [ ] 프로덕션 도메인 HTTPS 접근 정상
- [ ] 모바일/태블릿/데스크톱 전체 반응형 확인
- [ ] 개인정보처리방침, 이용약관, 소개 페이지 존재 및 접근 가능
- [ ] Google Search Console 소유권 확인 완료
- [ ] sitemap.xml Search Console에 제출 완료
- [ ] 주요 페이지 색인 요청 완료 (홈, 목록 페이지, 상위 상세 페이지)
- [ ] Rich Results Test 통과 (Recipe, Campground, Restaurant, TouristAttraction)

---

## 전체 의존관계 다이어그램

```
Phase 0 (부트스트랩)
  │
  ├──► Phase 1 (TourAPI + 지도 + 여행지/맛집)
  │       │
  │       ├──► Phase 2 (특산품 + 레시피)
  │       │
  │       ├──► Phase 3 (접근성 정보)
  │       │       │
  │       │       └──► Phase 4 (날씨 + 지역 허브 + 홈)
  │       │               │
  │       └───────────────►│
  │                        │
  Phase 2 ────────────────►│
                           │
                           └──► Phase 5 (번역 + SEO + 프로덕션)
```

### Phase 병렬화 가능 구간
- Phase 2와 Phase 3는 Phase 1 완료 후 **병렬 진행 가능**
- Phase 4는 Phase 1~3 결과를 통합하므로 순차 진행
- Phase 5는 모든 기능 완성 후 진행

---

## 일정 요약

| Phase | 기간 | 주요 산출물 |
|-------|------|-----------|
| Phase 0 | Day 1-2 | 프로젝트 기반, 레이아웃, 라우트 |
| Phase 1 | Day 3-10 | 여행지/맛집/캠핑장 탐색, 지도, 리뷰, 검색 |
| Phase 2 | Day 10-13 | 특산품, 레시피 |
| Phase 3 | Day 14-16 | 접근성 정보, 대상별 필터 |
| Phase 4 | Day 17-20 | 날씨, 지역 허브, 홈페이지 |
| Phase 5 | Day 21-25 | 영어 번역, SEO, 프로덕션 배포 |
| **Total** | **25일** | **MVP 완성** |
