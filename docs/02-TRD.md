# 02-TRD: Technical Requirements Document

> **프로젝트**: 여행한입 (Trip Bite)
> **작성일**: 2026-03-11
> **버전**: 1.0

---

## 1. 기술 스택 상세

| Layer | Technology | Version | 선택 이유 |
|-------|-----------|---------|----------|
| Framework | Next.js | 15 (App Router) | SSR/SSG, 파일 기반 라우팅, React Server Components |
| Language | TypeScript | 5.x | 타입 안전성, DX 향상 |
| Package Manager | pnpm | 9.x | 빠른 설치, 디스크 효율적 |
| Styling | Tailwind CSS | v4 | 유틸리티 퍼스트, JIT, 빠른 프로토타이핑 |
| UI Components | shadcn/ui | latest | 접근성 내장, 커스터마이징 용이, 번들 최적화 |
| i18n | next-intl | latest | App Router 네이티브, Server Components 호환 |
| Backend/DB | Supabase | latest | PostgreSQL, Auth, Storage, Edge Functions 통합 |
| Maps (Primary) | Naver Maps JS API | v3 | 국내 사용자 친숙도, 상세 국내 데이터 |
| Maps (Secondary) | Kakao Maps API | latest | 폴백, 길찾기 연동 |
| Deploy | Vercel | - | Next.js 최적화, Edge Network, 자동 배포 |
| Linting | ESLint + Prettier | latest | 코드 일관성 |

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Next.js  │  │  Naver   │  │  Kakao   │  │  i18n    │    │
│  │  React    │  │  Maps    │  │  Maps    │  │ (next-   │    │
│  │  (RSC +   │  │  JS API  │  │  JS API  │  │  intl)   │    │
│  │  Client)  │  │          │  │          │  │          │    │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────┘    │
│       │                                                      │
└───────┼──────────────────────────────────────────────────────┘
        │ HTTPS
┌───────┼──────────────────────────────────────────────────────┐
│       ▼            Vercel Edge Network                       │
│  ┌─────────────────────────────────────────────────┐         │
│  │              Next.js Server (Vercel)             │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │         │
│  │  │  Server   │  │   API    │  │ Middleware│      │         │
│  │  │Components │  │  Routes  │  │(i18n+Auth)│      │         │
│  │  └────┬─────┘  └────┬─────┘  └──────────┘      │         │
│  │       │              │                           │         │
│  │       ▼              ▼                           │         │
│  │  ┌──────────────────────────┐                    │         │
│  │  │    API Proxy Layer       │                    │         │
│  │  │  (Rate Limiting, Cache)  │                    │         │
│  │  └────┬────┬────┬────┬─────┘                    │         │
│  └───────┼────┼────┼────┼──────────────────────────┘         │
└──────────┼────┼────┼────┼────────────────────────────────────┘
           │    │    │    │
     ┌─────┘    │    │    └─────┐
     ▼          ▼    ▼          ▼
┌─────────┐ ┌─────┐ ┌──────┐ ┌──────────┐ ┌──────────┐
│Supabase │ │Tour │ │Recipe│ │  Weather  │ │GoCamping │
│(PG+Auth │ │API  │ │API   │ │  API      │ │  API     │
│+Storage)│ │4.0  │ │      │ │(기상청)   │ │(고캠핑)  │
└─────────┘ └─────┘ └──────┘ └──────────┘ └──────────┘
```

### 데이터 플로우

```
1. 사용자 요청
   Browser → Vercel Edge → Next.js Server

2. 데이터 조회 (캐시 우선)
   Server Component → Supabase (캐시 확인)
     → 캐시 히트: Supabase 데이터 반환
     → 캐시 미스: 외부 API 호출 → Supabase에 캐시 저장 → 반환

3. 지도 렌더링
   Client Component → Naver Maps JS API (직접 로드)

4. 날씨 조회
   Server Component → weather_cache (3시간 캐시)
     → 캐시 미스: 기상청 API → weather_cache 저장
```

---

## 3. 프로젝트 디렉토리 구조

```
trip-bite/
├── .env.local                      # 환경 변수 (API 키, Supabase URL 등)
├── .env.example                    # 환경 변수 템플릿
├── next.config.ts                  # Next.js 설정
├── postcss.config.mjs              # PostCSS 설정
├── tsconfig.json                   # TypeScript 설정
├── middleware.ts                   # next-intl + Supabase 세션 미들웨어
├── package.json
├── pnpm-lock.yaml
│
├── messages/                       # i18n 번역 파일
│   ├── ko.json                     # 한국어
│   └── en.json                     # 영어
│
├── public/                         # 정적 자산
│   ├── images/
│   │   └── korea-map.svg           # SVG 한국 지도
│   ├── fonts/
│   ├── favicon.ico
│   ├── robots.txt
│   └── ...
│
├── src/
│   ├── app/
│   │   ├── sitemap.ts              # 동적 사이트맵 생성
│   │   ├── robots.ts               # 동적 robots 생성 (또는 public/robots.txt 유지)
│   │   └── [locale]/               # 로케일 기반 라우팅
│   │       ├── layout.tsx          # 루트 레이아웃 (providers, nav)
│   │       ├── page.tsx            # 홈페이지
│   │       ├── loading.tsx         # 글로벌 로딩
│   │       ├── error.tsx           # 글로벌 에러
│   │       ├── not-found.tsx       # 404 페이지
│   │       │
│   │       ├── travel/
│   │       │   ├── page.tsx        # 여행지 목록
│   │       │   └── [id]/
│   │       │       └── page.tsx    # 여행지 상세
│   │       │
│   │       ├── restaurants/
│   │       │   ├── page.tsx        # 맛집 목록
│   │       │   └── [id]/
│   │       │       └── page.tsx    # 맛집 상세
│   │       │
│   │       ├── specialties/
│   │       │   ├── page.tsx        # 특산품 목록
│   │       │   └── [id]/
│   │       │       └── page.tsx    # 특산품 상세
│   │       │
│   │       ├── recipes/
│   │       │   ├── page.tsx        # 레시피 목록
│   │       │   └── [id]/
│   │       │       └── page.tsx    # 레시피 상세
│   │       │
│   │       ├── camping/
│   │       │   ├── page.tsx        # 캠핑장 목록
│   │       │   └── [id]/
│   │       │       └── page.tsx    # 캠핑장 상세
│   │       │
│   │       ├── search/
│   │       │   └── page.tsx        # 통합 검색
│   │       │
│   │       └── region/
│   │           └── [areaCode]/
│   │               └── page.tsx    # 지역 허브
│   │
│   ├── app/globals.css             # Tailwind v4 import + @theme 토큰
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 컴포넌트 (커스텀 테마)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                 # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   │
│   │   ├── cards/                  # 카드 컴포넌트
│   │   │   ├── TravelCard.tsx
│   │   │   ├── RestaurantCard.tsx
│   │   │   ├── SpecialtyCard.tsx
│   │   │   ├── RecipeCard.tsx
│   │   │   └── CampingCard.tsx
│   │   │
│   │   ├── filters/               # 필터 컴포넌트
│   │   │   ├── RegionFilter.tsx
│   │   │   ├── ThemeFilter.tsx
│   │   │   ├── TargetGroupFilter.tsx
│   │   │   └── CampingFilter.tsx
│   │   │
│   │   ├── maps/                  # 지도 컴포넌트
│   │   │   ├── NaverMap.tsx
│   │   │   ├── MapMarker.tsx
│   │   │   └── KoreaMapSvg.tsx
│   │   │
│   │   ├── weather/               # 날씨 컴포넌트
│   │   │   └── WeatherWidget.tsx
│   │   │
│   │   └── shared/                # 공통 컴포넌트
│   │       ├── ImageGallery.tsx
│   │       ├── AccessibilityBadge.tsx
│   │       ├── SearchBar.tsx
│   │       ├── Rating.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/
│   │   ├── supabase/              # Supabase 클라이언트
│   │   │   ├── client.ts          # 브라우저 클라이언트
│   │   │   ├── server.ts          # 서버 클라이언트
│   │   │   └── middleware.ts      # 미들웨어 클라이언트
│   │   │
│   │   ├── api/                   # 외부 API 클라이언트
│   │   │   ├── tour-api.ts        # TourAPI 4.0
│   │   │   ├── recipe-api.ts      # COOKRCP01
│   │   │   ├── map-api.ts         # 지도 유틸리티
│   │   │   ├── weather-api.ts     # 기상청 단기예보
│   │   │   ├── specialty-api.ts   # 특산품 데이터
│   │   │   └── camping-api.ts     # 고캠핑 API
│   │   │
│   │   ├── constants/             # 상수
│   │   │   ├── area-codes.ts      # 지역 코드 매핑
│   │   │   ├── content-types.ts   # TourAPI contentTypeId
│   │   │   └── grid-coords.ts     # 기상청 격자좌표 매핑
│   │   │
│   │   └── utils/                 # 유틸리티
│   │       ├── format.ts          # 날짜, 숫자 포맷
│   │       ├── seo.ts             # SEO 헬퍼 (메타데이터 생성)
│   │       └── cache.ts           # 캐시 유틸리티
│   │
│   ├── i18n/                      # next-intl 설정
│   │   ├── config.ts              # 로케일 설정
│   │   ├── request.ts             # getRequestConfig
│   │   └── routing.ts             # createNavigation
│   │
│   └── types/                     # TypeScript 타입 정의
│       ├── destination.ts
│       ├── specialty.ts
│       ├── recipe.ts
│       ├── review.ts
│       ├── weather.ts
│       ├── camping.ts
│       ├── tour-api.ts            # TourAPI 응답 타입
│       └── index.ts               # 공통 타입 re-export
│
├── supabase/
│   ├── migrations/                # SQL 마이그레이션
│   │   ├── 001_extensions.sql
│   │   ├── 002_helper_functions.sql
│   │   ├── 003_regions.sql
│   │   ├── 004_destinations.sql
│   │   ├── 005_camping_sites.sql
│   │   ├── 006_specialties.sql
│   │   ├── 007_recipes.sql
│   │   ├── 008_reviews.sql
│   │   ├── 009_weather_cache.sql
│   │   ├── 010_accessibility_info.sql
│   │   ├── 011_rls_policies.sql
│   │   └── 012_cron_jobs.sql
│   └── seed.sql                   # 초기 데이터 시드
│
└── docs/                          # 프로젝트 문서
    ├── 01-PRD.md
    ├── 02-TRD.md
    └── ...
```

---

## 4. 인프라

### 4.1 Vercel

| 항목 | 설정 |
|------|------|
| Framework | Next.js (자동 감지) |
| Build Command | `pnpm build` |
| Output Directory | `.next` |
| Node.js Version | 20.x |
| Region | icn1 (Seoul) |
| Environment Variables | Supabase URL/Key, API Keys |

**배포 전략:**
- `main` 브랜치 → 프로덕션 자동 배포
- PR → Preview 배포 (자동)
- 환경 변수: Production / Preview / Development 분리

### 4.2 Supabase

| 항목 | 설정 |
|------|------|
| Region | Northeast Asia (Seoul) |
| Database | PostgreSQL 15 |
| Extensions | PostGIS (지리 데이터), pg_cron (스케줄링), pg_net (Edge Function 호출) |
| Auth | Email/Password, Google OAuth (선택) |
| Storage | 이미지 캐시용 버킷 |
| Edge Functions | 데이터 시드, 배치 동기화 |

**Supabase 클라이언트 설정:**
- `@supabase/ssr` 사용 (Next.js App Router 호환)
- Server Components: `createServerClient` (쿠키 기반 세션)
- Client Components: `createBrowserClient`
- Middleware: 세션 리프레시

---

## 5. 보안 요구사항

### 5.1 데이터 접근 제어 (RLS)

```sql
-- 예시: destinations 테이블 읽기 정책
CREATE POLICY "Anyone can read destinations"
  ON destinations FOR SELECT
  USING (true);

-- 예시: reviews 테이블 쓰기 정책
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND num_nonnulls(destination_id, camping_site_id) = 1
  );

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);
```

### 5.2 API 키 관리

| 키 | 저장 위치 | 접근 범위 |
|----|----------|----------|
| NEXT_PUBLIC_SUPABASE_URL | `.env.local` / Vercel Env | Server + Client |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | `.env.local` / Vercel Env | Server + Client |
| SUPABASE_SERVICE_ROLE_KEY | `.env.local` / Vercel Env | Server only |
| TOUR_API_KEY | `.env.local` / Vercel Env | Server only |
| RECIPE_API_KEY | `.env.local` / Vercel Env | Server only |
| NAVER_MAP_CLIENT_ID | `.env.local` / Vercel Env | Client (도메인 제한) |
| KAKAO_MAP_APP_KEY | `.env.local` / Vercel Env | Client (도메인 제한) |
| WEATHER_API_KEY | `.env.local` / Vercel Env | Server only |
| CAMPING_API_KEY | `.env.local` / Vercel Env | Server only |

### 5.3 Rate Limiting

- API Route에 rate limiting 미들웨어 적용
- TourAPI 프록시: 분당 100회 제한
- 레시피 API 프록시: 분당 50회 제한
- 고캠핑 API 프록시: 분당 100회 제한
- 리뷰 작성: 사용자당 분당 5회 제한

### 5.4 기타 보안

- HTTPS 강제 (Vercel 기본 제공)
- Content Security Policy (CSP) 헤더 설정
- XSS 방지: React 기본 이스케이핑 + DOMPurify (사용자 입력)
- CSRF: Next.js 기본 보호 + Supabase Auth 토큰
- `.env.local`을 `.gitignore`에 포함
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하지 않음

---

## 6. 성능 요구사항

### 6.1 Lighthouse 목표

| 카테고리 | 목표 점수 |
|---------|----------|
| Performance | >90 |
| Accessibility | >95 |
| Best Practices | >90 |
| SEO | >95 |

### 6.2 Core Web Vitals 목표

| 지표 | 목표 | 최적화 전략 |
|------|------|------------|
| LCP (Largest Contentful Paint) | <2.5s | next/image, 이미지 최적화, 프리로드 |
| FID (First Input Delay) | <100ms | 코드 스플리팅, Server Components |
| CLS (Cumulative Layout Shift) | <0.1 | 이미지 크기 지정, 스켈레톤 UI |
| TTFB (Time to First Byte) | <800ms | Vercel Edge, ISR/SSG |
| INP (Interaction to Next Paint) | <200ms | 클라이언트 JS 최소화 |

### 6.3 성능 최적화 전략

**이미지 최적화:**
- `next/image` 컴포넌트 사용 (자동 WebP 변환, 리사이징)
- TourAPI 이미지 URL → Next.js Image Optimization 파이프라인
- Lazy loading (뷰포트 진입 시 로드)
- 블러 placeholder

**번들 최적화:**
- React Server Components 기본 (클라이언트 JS 최소화)
- Dynamic import (`next/dynamic`) for 지도, 갤러리 등
- Tree shaking (사용하지 않는 코드 제거)
- shadcn/ui 컴포넌트 개별 import

**데이터 캐싱:**
- Supabase를 API 캐시로 활용 (destinations, weather_cache)
- Next.js `fetch` 캐시 + ISR (revalidate)
- `unstable_cache` for 서버 사이드 데이터 캐시
- 클라이언트 상태: 최소화 (Server Components 우선)

**네트워크 최적화:**
- Vercel Edge Network (글로벌 CDN)
- 폰트 프리로드 (`next/font`)
- DNS 프리페치 (외부 API 도메인)
- Prefetch (링크 호버 시 데이터 프리패치)

---

## 7. 개발 환경 및 도구

### 7.1 개발 환경 설정

```bash
# 프로젝트 클론 후
pnpm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local에 API 키 입력

# Supabase 로컬 개발
npx supabase start
npx supabase db push

# 개발 서버 실행
pnpm dev
```

### 7.2 스크립트

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db seed"
  }
}
```

### 7.3 코드 품질

- **ESLint**: Next.js 기본 규칙 + TypeScript 규칙
- **Prettier**: 코드 포맷팅
- **TypeScript strict mode**: 엄격한 타입 검사
- **Pre-commit hook** (선택): lint-staged + husky

---

## 8. 모니터링 및 에러 처리

### 8.1 에러 처리 전략

- **Server Components**: `error.tsx` 경계로 에러 캐치
- **API Routes**: try-catch + 표준 에러 응답 형식
- **외부 API 실패**: Supabase 캐시 폴백 → 에러 메시지
- **빈 상태**: EmptyState 컴포넌트로 안내

### 8.2 로깅

- Vercel 빌트인 로그 (서버 사이드)
- `console.error` for 중요 에러 (Vercel Log Drain 연동 가능)
- API 호출 실패 로깅 (외부 API 상태 추적)

### 8.3 모니터링 (Post-MVP)

- Vercel Analytics (Core Web Vitals 추적)
- Vercel Speed Insights
- Sentry (에러 트래킹, 선택)
