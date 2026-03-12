# 06-Page Structure

> **프로젝트**: 여행한입 (Trip Bite)
> **작성일**: 2026-03-11
> **버전**: 1.0

---

## 1. 전체 라우팅 맵

### 1.1 라우트 구조 (`[locale]` 기반)

```
/                              → 홈 (한국어, 기본 로케일)
/en                            → 홈 (영어)

/[locale]/travel               → 여행지 목록
/[locale]/travel/[id]          → 여행지 상세

/[locale]/restaurants          → 맛집 목록
/[locale]/restaurants/[id]     → 맛집 상세

/[locale]/specialties          → 특산품 목록
/[locale]/specialties/[id]     → 특산품 상세

/[locale]/recipes              → 레시피 목록
/[locale]/recipes/[id]         → 레시피 상세

/[locale]/camping              → 캠핑장 목록
/[locale]/camping/[id]         → 캠핑장 상세

/[locale]/search               → 통합 검색 (쿼리: ?q=키워드)
/[locale]/region/[areaCode]    → 지역 허브
/[locale]/privacy              → 개인정보처리방침
/[locale]/terms                → 이용약관
/[locale]/about                → 서비스 소개
```

### 1.2 로케일 라우팅 전략

| 로케일 | URL 패턴 | 설명 |
|--------|---------|------|
| 한국어 (ko) | `/travel` | 기본 로케일, prefix 없음 |
| 영어 (en) | `/en/travel` | prefix 있음 (`as-needed`) |

```typescript
// src/i18n/config.ts
export const locales = ['ko', 'en'] as const;
export const defaultLocale = 'ko' as const;

// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed',  // ko: prefix 없음, en: /en prefix
});
```

### 1.3 파일 시스템 구조

```
src/app/
├── [locale]/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈
│   ├── loading.tsx             # 글로벌 로딩
│   ├── error.tsx               # 글로벌 에러
│   ├── not-found.tsx           # 404
│   │
│   ├── travel/
│   │   ├── page.tsx            # 여행지 목록
│   │   ├── loading.tsx
│   │   └── [id]/
│   │       ├── page.tsx        # 여행지 상세
│   │       └── loading.tsx
│   │
│   ├── restaurants/
│   │   ├── page.tsx            # 맛집 목록
│   │   ├── loading.tsx
│   │   └── [id]/
│   │       ├── page.tsx        # 맛집 상세
│   │       └── loading.tsx
│   │
│   ├── specialties/
│   │   ├── page.tsx            # 특산품 목록
│   │   ├── loading.tsx
│   │   └── [id]/
│   │       ├── page.tsx        # 특산품 상세
│   │       └── loading.tsx
│   │
│   ├── recipes/
│   │   ├── page.tsx            # 레시피 목록
│   │   ├── loading.tsx
│   │   └── [id]/
│   │       ├── page.tsx        # 레시피 상세
│   │       └── loading.tsx
│   │
│   ├── camping/
│   │   ├── page.tsx            # 캠핑장 목록
│   │   ├── loading.tsx
│   │   └── [id]/
│   │       ├── page.tsx        # 캠핑장 상세
│   │       └── loading.tsx
│   │
│   ├── search/
│   │   ├── page.tsx            # 통합 검색
│   │   └── loading.tsx
│   │
│   ├── region/
│   │   └── [areaCode]/
│   │       ├── page.tsx        # 지역 허브
│   │       └── loading.tsx
│   │
│   ├── privacy/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   └── about/
│       └── page.tsx
│
├── api/                        # API Routes (프록시)
│   ├── tour/route.ts           # TourAPI 프록시
│   ├── recipes/route.ts        # 레시피 API 프록시
│   └── weather/route.ts        # 날씨 API 프록시
│
└── sitemap.ts                  # 동적 사이트맵 생성
```

---

## 2. 페이지별 와이어프레임 설명

### 2.1 홈페이지 (`/`)

```
┌──────────────────────────────────────────────┐
│                  [Header]                     │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │           HERO SECTION               │    │
│  │                                      │    │
│  │   "한 입에 담는 대한민국 여행"          │    │
│  │   여행지, 맛집, 특산품을 한곳에서       │    │
│  │                                      │    │
│  │   ┌──────────────────────────┐       │    │
│  │   │ 🔍 검색바                 │       │    │
│  │   └──────────────────────────┘       │    │
│  │                                      │    │
│  │   [인기 검색어 태그들]                 │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ─── 추천 여행지 ─────────────────────────    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │카드 │ │카드 │ │카드 │ │카드 │  ← 캐러셀    │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
│  ─── 인기 지역 ──────────────────────────    │
│  ┌─────────────────────────┐                │
│  │   [SVG 한국 지도]        │                │
│  │   클릭 시 지역 허브 이동   │                │
│  └─────────────────────────┘                │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │서울 │ │부산 │ │제주 │ │강원 │               │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
│  ─── 제철 특산품 ────────────────────────    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │카드 │ │카드 │ │카드 │ │카드 │               │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
│  ─── 추천 캠핑장 ──────────────────────      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │캠핑 │ │캠핑 │ │캠핑 │ │캠핑 │  ← 캐러셀    │
│  │카드 │ │카드 │ │카드 │ │카드 │               │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
│  ─── 오늘의 날씨별 추천 ─────────────────    │
│  ┌────────────────────────────────┐         │
│  │ ☀️ 오늘 서울 맑음 15°C           │         │
│  │ 이런 날엔 이곳이 좋아요!          │         │
│  │ ┌────┐ ┌────┐ ┌────┐          │         │
│  │ │추천1│ │추천2│ │추천3│          │         │
│  │ └────┘ └────┘ └────┘          │         │
│  └────────────────────────────────┘         │
│                                              │
│  ─── 최신 레시피 ────────────────────────    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │카드 │ │카드 │ │카드 │ │카드 │               │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
├──────────────────────────────────────────────┤
│                  [Footer]                     │
└──────────────────────────────────────────────┘
```

**데이터 소스:**
- 추천 여행지: destinations (`popular = review_count DESC`, 동률 시 `avg_rating DESC`, 상위 8개)
- 인기 지역: regions (정적)
- 제철 특산품: specialties (현재 월 기반 season_months 필터)
- 날씨별 추천: weather_cache (지역 대표 날씨) + destinations (날씨 조건 기반 추천 로직)
- 추천 캠핑장: camping_sites (`popular = review_count DESC`, 동률 시 `avg_rating DESC`, 상위 8개)
- 최신 레시피: recipes (최신순 8개)

### 2.2 여행지 목록 (`/travel`)

```
┌──────────────────────────────────────────────┐
│                  [Header]                     │
├──────────────────────────────────────────────┤
│                                              │
│  여행지 탐색                                  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 🔍 여행지를 검색하세요                  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [지역 필터] 전체 | 서울 | 부산 | 제주 | ...  │
│  [테마 필터] 관광지 | 문화시설 | 축제 | ...    │
│  [접근성 필터] 🐾 | ♿ | 🌐                  │
│                                              │
│  42개 여행지                          정렬 ▾  │
│                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │     │ │     │ │     │ │     │            │
│  │카드  │ │카드  │ │카드  │ │카드  │            │
│  │     │ │     │ │     │ │     │            │
│  └─────┘ └─────┘ └─────┘ └─────┘           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │     │ │     │ │     │ │     │            │
│  │카드  │ │카드  │ │카드  │ │카드  │            │
│  │     │ │     │ │     │ │     │            │
│  └─────┘ └─────┘ └─────┘ └─────┘           │
│                                              │
│  [더 보기] 또는 무한 스크롤                    │
│                                              │
├──────────────────────────────────────────────┤
│                  [Footer]                     │
└──────────────────────────────────────────────┘
```

**쿼리 파라미터:**
- `?area=1` - 지역 필터
- `?type=12` - 테마 필터
- `?target=pet,wheelchair` - 접근성 필터
- `?sort=popular` - 정렬 (`popular=review_count DESC`, `rating=avg_rating DESC`, `recent=updated_at DESC`)
- `?page=1` - 페이지네이션

### 2.3 여행지 상세 (`/travel/[id]`)

```
┌──────────────────────────────────────────────┐
│                  [Header]                     │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │          [메인 이미지]                 │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│  [썸네일1] [썸네일2] [썸네일3] [+5]           │
│                                              │
│  경복궁                                      │
│  ⭐ 4.5 (156개 리뷰) · 서울특별시 종로구       │
│  [🐾 반려동물] [♿ 휠체어] [🌐 외국어]         │
│                                              │
│  ─── 지역 대표 날씨 ───────────────────      │
│  ┌────────────────────────────────┐          │
│  │ [WeatherWidget]                │          │
│  └────────────────────────────────┘          │
│                                              │
│  ─── 소개 ────────────────────────────       │
│  조선왕조 제일의 법궁인 경복궁은...             │
│                                              │
│  ─── 상세 정보 ──────────────────────         │
│  📍 주소: 서울특별시 종로구 사직로 161          │
│  📞 전화: 02-3700-3900                       │
│  🕐 운영시간: 09:00~18:00                     │
│  💰 입장료: 3,000원                           │
│  🅿️ 주차: 가능                               │
│                                              │
│  ─── 접근성 정보 ────────────────────         │
│  🐾 반려동물 동반                              │
│     소형견만 가능, 리드줄 필수                   │
│  ♿ 휠체어 접근성                              │
│     경사로 있음, 엘리베이터 있음                 │
│                                              │
│  ─── 위치 ────────────────────────────       │
│  ┌────────────────────────────────┐          │
│  │                                │          │
│  │        [네이버 지도]             │          │
│  │                                │          │
│  └────────────────────────────────┘          │
│  [네이버 지도에서 보기] [카카오맵 길찾기]        │
│                                              │
│  ─── 리뷰 (156) ─────────────────────        │
│  [리뷰 작성하기]                               │
│                                              │
│  ⭐⭐⭐⭐⭐ 김여행                            │
│  정말 아름다운 곳이에요! 강력 추천합니다.        │
│  2026.03.10                                  │
│                                              │
│  ⭐⭐⭐⭐☆ Sarah                             │
│  Beautiful palace! Worth visiting.           │
│  2026.03.09                                  │
│                                              │
│  [더 보기]                                    │
│                                              │
│  ─── 주변 여행지 ────────────────────         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │카드 │ │카드 │ │카드 │ │카드 │               │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
├──────────────────────────────────────────────┤
│                  [Footer]                     │
└──────────────────────────────────────────────┘
```

### 2.4 맛집 페이지

여행지와 동일한 구조. 차이점:
- 목록: `contentTypeId=39` 필터
- 상세: 메뉴, 영업시간, 대표메뉴, 포장 가능 여부 등 추가 정보 (detailIntro1)

### 2.5 캠핑장 목록 (`/camping`)

```
┌──────────────────────────────────────────────┐
│                  [Header]                     │
├──────────────────────────────────────────────┤
│                                              │
│  캠핑장 탐색                                  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 🔍 캠핑장을 검색하세요                 │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [업종 필터] 전체 | 일반야영장 | 자동차야영장 |  │
│              글램핑 | 카라반                   │
│  [시설 필터] 전기 | WiFi | 온수 | 장작 | ...   │
│  [반려동물] 전체 | 가능 | 소형견               │
│  [바닥 타입] 잔디 | 데크 | 파쇄석 | ...        │
│  [지역 필터] 전체 | 서울 | 경기 | 강원 | ...   │
│                                              │
│  128개 캠핑장                         정렬 ▾  │
│                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │     │ │     │ │     │ │     │            │
│  │캠핑  │ │캠핑  │ │캠핑  │ │캠핑  │            │
│  │카드  │ │카드  │ │카드  │ │카드  │            │
│  │     │ │     │ │     │ │     │            │
│  └─────┘ └─────┘ └─────┘ └─────┘           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │     │ │     │ │     │ │     │            │
│  │캠핑  │ │캠핑  │ │캠핑  │ │캠핑  │            │
│  │카드  │ │카드  │ │카드  │ │카드  │            │
│  │     │ │     │ │     │ │     │            │
│  └─────┘ └─────┘ └─────┘ └─────┘           │
│                                              │
│  [더 보기] 또는 무한 스크롤                    │
│                                              │
├──────────────────────────────────────────────┤
│                  [Footer]                     │
└──────────────────────────────────────────────┘
```

**쿼리 파라미터:**
- `?area=32` - 지역 필터
- `?induty=일반야영장` - 업종 필터
- `?animal=가능` - 반려동물 필터
- `?facilities=전기,온수` - 부대시설 필터
- `?bottom=grass,deck` - 바닥 타입 필터
- `?sort=popular` - 정렬 (`popular=review_count DESC`, `rating=avg_rating DESC`, `recent=updated_at DESC`)
- `?page=1` - 페이지네이션

### 2.6 캠핑장 상세 (`/camping/[id]`)

```
┌──────────────────────────────────────────────┐
│                  [Header]                     │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │          [메인 이미지]                 │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│  [썸네일1] [썸네일2] [썸네일3] [+5]           │
│                                              │
│  서울숲 캠핑장                                │
│  ⭐ 4.3 (45개 리뷰) · 서울특별시 성동구        │
│  [⛺ 일반야영장] [🐾 소형견] [🔥 화로대]       │
│                                              │
│  ─── 시설 정보 ─────────────────────────     │
│  부대시설: 전기, 무선인터넷, 장작판매, 온수     │
│  주변시설: 산책로, 놀이터                      │
│  화로대: 개별 사용 가능                        │
│  트레일러: 불가 · 카라반: 불가                  │
│                                              │
│  ─── 사이트 현황 ───────────────────────     │
│  ┌──────────────────────────────────┐        │
│  │ 사이트 유형                        │        │
│  │ ⛺ 일반 사이트     30개            │        │
│  │ 🏕 글램핑 사이트    5개            │        │
│  ├──────────────────────────────────┤        │
│  │ 바닥 타입                          │        │
│  │ 🌿 잔디    20개                   │        │
│  │ 🪵 데크    10개                   │        │
│  └──────────────────────────────────┘        │
│                                              │
│  ─── 운영 정보 ─────────────────────────     │
│  운영 기간: 봄, 여름, 가을                     │
│  운영일: 평일 + 주말                           │
│  휴장 기간: 2026.12.01 ~ 2027.02.28          │
│                                              │
│  ─── 지역 대표 날씨 ───────────────────      │
│  ┌────────────────────────────────┐          │
│  │ [WeatherWidget]                │          │
│  └────────────────────────────────┘          │
│                                              │
│  ─── 위치 ────────────────────────────       │
│  ┌────────────────────────────────┐          │
│  │                                │          │
│  │        [네이버 지도]             │          │
│  │                                │          │
│  └────────────────────────────────┘          │
│  [네이버 지도에서 보기] [카카오맵 길찾기]        │
│                                              │
│  ─── 리뷰 (45) ──────────────────────        │
│  [리뷰 작성하기]                               │
│  ⭐⭐⭐⭐⭐ 최캠핑                            │
│  사이트가 넓고 시설이 깨끗해요!                 │
│  2026.03.08                                  │
│  [더 보기]                                    │
│                                              │
│  ─── 주변 캠핑장 ───────────────────         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │카드 │ │카드 │ │카드 │ │카드 │               │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
├──────────────────────────────────────────────┤
│                  [Footer]                     │
└──────────────────────────────────────────────┘
```

### 2.7 특산품 목록 (`/specialties`)

```
┌──────────────────────────────────────────────┐
│                  [Header]                     │
├──────────────────────────────────────────────┤
│                                              │
│  지역 특산품                                  │
│                                              │
│  [지역 필터] 전체 | 서울 | 부산 | 제주 | ...  │
│  [카테고리] 전체 | 농산물 | 수산물 | 축산물 |...│
│  [제철 필터] 전체 | 봄 | 여름 | 가을 | 겨울    │
│                                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │특산 │ │특산 │ │특산 │ │특산 │               │
│  │품   │ │품   │ │품   │ │품   │               │
│  │카드 │ │카드 │ │카드 │ │카드 │               │
│  └────┘ └────┘ └────┘ └────┘               │
│                                              │
├──────────────────────────────────────────────┤
│                  [Footer]                     │
└──────────────────────────────────────────────┘
```

### 2.8 특산품 상세 (`/specialties/[id]`)

```
┌──────────────────────────────────────────────┐
│  [이미지]                                     │
│  제주 감귤                                     │
│  📍 제주특별자치도 · 🏷 과일류 · 🍂 10~2월     │
│                                              │
│  ─── 소개 ────────────────────────────       │
│  제주의 대표 특산품인 감귤은...                  │
│                                              │
│  ─── 연결 레시피 ────────────────────         │
│  ┌────┐ ┌────┐ ┌────┐                       │
│  │감귤 │ │감귤 │ │감귤 │                       │
│  │잼   │ │주스 │ │케이크│                       │
│  └────┘ └────┘ └────┘                       │
│                                              │
│  ─── 이 지역의 다른 특산품 ──────────         │
│  ┌────┐ ┌────┐ ┌────┐                       │
│  └────┘ └────┘ └────┘                       │
└──────────────────────────────────────────────┘
```

### 2.9 레시피 상세 (`/recipes/[id]`)

```
┌──────────────────────────────────────────────┐
│  [메인 이미지]                                 │
│  김치찌개                                      │
│  ⏱ 30분 · 👤 2인분 · 🔥 431kcal · 난이도 쉬움  │
│                                              │
│  ─── 재료 ────────────────────────────       │
│  □ 김치 200g                                 │
│  □ 돼지고기 150g                              │
│  □ 두부 1/2모                                 │
│  □ ...                                       │
│                                              │
│  ─── 조리 순서 ──────────────────────         │
│  Step 1                                      │
│  [단계 이미지]                                 │
│  냄비에 참기름을 두르고 김치를 볶는다.            │
│                                              │
│  Step 2                                      │
│  [단계 이미지]                                 │
│  돼지고기를 넣고 함께 볶는다.                    │
│                                              │
│  Step 3 ...                                  │
│                                              │
│  ─── 영양 정보 ──────────────────────         │
│  칼로리 431kcal | 탄수화물 14.6g |             │
│  단백질 41.4g | 지방 22.8g | 나트륨 1336mg     │
│                                              │
│  ─── 연결 특산품 ────────────────────         │
│  ┌────────────────────────────┐              │
│  │ 🏷 이 레시피의 주재료 특산품  │              │
│  │ [특산품카드]                 │              │
│  └────────────────────────────┘              │
│                                              │
│  ─── 비슷한 레시피 ─────────────────         │
│  ┌────┐ ┌────┐ ┌────┐                       │
│  └────┘ └────┘ └────┘                       │
└──────────────────────────────────────────────┘
```

### 2.10 통합 검색 (`/search`)

```
┌──────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐    │
│  │ 🔍 "경복궁"                          │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [전체] [여행지 3] [맛집 5] [캠핑장 2] [특산품 1] [레시피 2]│
│                                              │
│  ─── 여행지 (3건) ───────────────────        │
│  ┌────┐ ┌────┐ ┌────┐                       │
│  └────┘ └────┘ └────┘                       │
│                                              │
│  ─── 맛집 (5건) ────────────────────         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  └────┘ └────┘ └────┘ └────┘ └────┘        │
│                                              │
│  ─── 캠핑장 (2건) ──────────────────        │
│  ┌────┐ ┌────┐                              │
│  └────┘ └────┘                              │
│                                              │
│  ─── 특산품 (1건) ──────────────────         │
│  ┌────┐                                     │
│  └────┘                                     │
│                                              │
│  ─── 레시피 (2건) ──────────────────         │
│  ┌────┐ ┌────┐                              │
│  └────┘ └────┘                              │
└──────────────────────────────────────────────┘
```

### 2.11 지역 허브 (`/region/[areaCode]`)

```
┌──────────────────────────────────────────────┐
│  [지역 히어로 이미지]                           │
│  제주특별자치도                                 │
│                                              │
│  ─── 오늘의 지역 대표 날씨 ───────────         │
│  ┌──────────────────────┐                    │
│  │ [WeatherWidget]       │                    │
│  └──────────────────────┘                    │
│                                              │
│  ─── 인기 여행지 ────────────────────         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  └────┘ └────┘ └────┘ └────┘               │
│  [여행지 전체 보기 →]                          │
│                                              │
│  ─── 맛집 ──────────────────────────         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  └────┘ └────┘ └────┘ └────┘               │
│  [맛집 전체 보기 →]                            │
│                                              │
│  ─── 인기 캠핑장 ──────────────────────      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  └────┘ └────┘ └────┘ └────┘               │
│  [캠핑장 전체 보기 →]                          │
│                                              │
│  ─── 특산품 ────────────────────────         │
│  ┌────┐ ┌────┐ ┌────┐                       │
│  └────┘ └────┘ └────┘                       │
│                                              │
│  ─── 전체 지도 ─────────────────────         │
│  ┌────────────────────────────────┐          │
│  │        [네이버 지도]             │          │
│  │     (지역 전체 마커 표시)         │          │
│  └────────────────────────────────┘          │
└──────────────────────────────────────────────┘
```

---

## 3. i18n 설정 (next-intl)

### 3.1 설정 파일

```typescript
// src/i18n/config.ts
export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';

// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/travel': '/travel',
    '/travel/[id]': '/travel/[id]',
    '/restaurants': '/restaurants',
    '/restaurants/[id]': '/restaurants/[id]',
    '/specialties': '/specialties',
    '/specialties/[id]': '/specialties/[id]',
    '/recipes': '/recipes',
    '/recipes/[id]': '/recipes/[id]',
    '/camping': '/camping',
    '/camping/[id]': '/camping/[id]',
    '/search': '/search',
    '/region/[areaCode]': '/region/[areaCode]',
    '/privacy': '/privacy',
    '/terms': '/terms',
    '/about': '/about',
  },
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### 3.2 번역 파일 구조

```json
// messages/ko.json
{
  "common": {
    "appName": "여행한입",
    "search": "검색",
    "filter": "필터",
    "sort": "정렬",
    "showMore": "더 보기",
    "noResults": "검색 결과가 없어요",
    "loading": "불러오는 중...",
    "error": "오류가 발생했어요"
  },
  "nav": {
    "home": "홈",
    "travel": "여행지",
    "restaurants": "맛집",
    "specialties": "특산품",
    "recipes": "레시피",
    "camping": "캠핑",
    "search": "검색"
  },
  "home": {
    "hero": {
      "title": "한 입에 담는 대한민국 여행",
      "subtitle": "여행지, 맛집, 특산품을 한곳에서",
      "searchPlaceholder": "여행지, 맛집, 특산품을 검색하세요..."
    },
    "recommended": "추천 여행지",
    "popularRegions": "인기 지역",
    "seasonalSpecialties": "제철 특산품",
    "weatherRecommendation": "오늘의 날씨별 추천",
    "latestRecipes": "최신 레시피"
  },
  "travel": {
    "title": "여행지 탐색",
    "searchPlaceholder": "여행지를 검색하세요"
  },
  "restaurants": {
    "title": "맛집 탐색",
    "searchPlaceholder": "맛집을 검색하세요"
  },
  "filters": { ... },
  "accessibility": { ... },
  "weather": { ... },
  "review": { ... }
}
```

### 3.3 미들웨어 설정

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

---

## 4. SEO 전략

### 4.1 메타데이터 생성

```typescript
// src/lib/utils/seo.ts
import type { Metadata } from 'next';

export function generatePageMetadata({
  title,
  description,
  image,
  locale,
  path,
}: {
  title: string;
  description: string;
  image?: string;
  locale: string;
  path: string;
}): Metadata {
  const baseUrl = 'https://tripbite.kr';
  const url = locale === 'ko' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`;

  return {
    title: `${title} | 여행한입`,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: '여행한입 Trip Bite',
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: url,
      languages: {
        'ko': `${baseUrl}${path}`,
        'en': `${baseUrl}/en${path}`,
      },
    },
  };
}
```

### 4.2 JSON-LD 구조화 데이터

| 페이지 | Schema Type | 주요 필드 |
|--------|------------|----------|
| 홈 | WebSite | name, url, potentialAction (SearchAction) |
| 여행지 상세 | TouristAttraction | name, description, geo, image, aggregateRating |
| 맛집 상세 | Restaurant | name, address, geo, image, servesCuisine, aggregateRating |
| 캠핑장 상세 | Campground | name, description, geo, image, amenityFeature, petsAllowed, aggregateRating |
| 레시피 상세 | Recipe | name, image, author, cookTime, nutrition, recipeIngredient, recipeInstructions |
| 지역 허브 | Place | name, geo, description |

**레시피 JSON-LD 예시:**
```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "김치찌개",
  "image": "https://...",
  "author": { "@type": "Organization", "name": "여행한입" },
  "cookTime": "PT30M",
  "recipeYield": "2인분",
  "nutrition": {
    "@type": "NutritionInformation",
    "calories": "431 kcal"
  },
  "recipeIngredient": ["김치 200g", "돼지고기 150g", "두부 1/2모"],
  "recipeInstructions": [
    { "@type": "HowToStep", "text": "냄비에 참기름을 두르고 김치를 볶는다." }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "23"
  }
}
```

### 4.3 사이트맵

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = 'https://tripbite.kr';

  // 정적 페이지
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/travel`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/restaurants`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/specialties`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/recipes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/camping`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    // ... 영어 버전 포함
  ];

  // 동적 페이지 (destinations)
  const { data: destinations } = await supabase
    .from('destinations')
    .select('id, content_type_id, updated_at');

  const destinationPages = (destinations || []).map((d) => ({
    url: `${baseUrl}/${d.content_type_id === 39 ? 'restaurants' : 'travel'}/${d.id}`,
    lastModified: new Date(d.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 동적 페이지 (camping_sites)
  const { data: campingSites } = await supabase
    .from('camping_sites')
    .select('id, updated_at');

  const campingPages = (campingSites || []).map((c) => ({
    url: `${baseUrl}/camping/${c.id}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, updated_at');

  const recipePages = (recipes || []).map((r) => ({
    url: `${baseUrl}/recipes/${r.id}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const { data: specialties } = await supabase
    .from('specialties')
    .select('id, updated_at');

  const specialtyPages = (specialties || []).map((s) => ({
    url: `${baseUrl}/specialties/${s.id}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const { data: regions } = await supabase
    .from('regions')
    .select('area_code, updated_at');

  const regionPages = (regions || []).map((region) => ({
    url: `${baseUrl}/region/${region.area_code}`,
    lastModified: new Date(region.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...destinationPages,
    ...campingPages,
    ...recipePages,
    ...specialtyPages,
    ...regionPages,
  ];
}
```

### 4.4 robots.txt

```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://tripbite.kr/sitemap.xml
```

### 4.5 OG 이미지 전략

- 홈/목록: 정적 기본 OG 이미지
- 상세 페이지: 여행지/맛집의 `first_image` 사용
- 레시피: `main_image` 사용
- 이미지 없는 경우: 텍스트 기반 동적 OG 이미지 생성 (`next/og`)

---

## 5. Google Search Console 색인 전략

### 5.1 소유권 확인

| 방법 | 설정 |
|------|------|
| HTML 메타태그 (권장) | `<meta name="google-site-verification" content="..." />` → `layout.tsx` metadata |
| DNS TXT 레코드 | 도메인 DNS에 TXT 레코드 추가 |
| HTML 파일 | `public/google{code}.html` 정적 파일 |

```typescript
// src/app/[locale]/layout.tsx - metadata에 추가
export const metadata: Metadata = {
  verification: {
    google: 'Google_Search_Console_인증코드',
  },
};
```

### 5.2 색인 관리

**sitemap 제출:**
1. Search Console → **[Sitemaps]** → `https://tripbite.kr/sitemap.xml` 제출
2. Next.js 동적 sitemap이 destinations + camping_sites + specialties + recipes + region 페이지를 모두 포함
3. 새 콘텐츠 추가 시 sitemap은 route cache 정책 또는 on-demand revalidate에 맞춰 갱신

**색인 요청 우선순위:**
| 우선순위 | 페이지 | 이유 |
|---------|--------|------|
| 1 | 홈, 여행지 목록, 맛집 목록, 캠핑장 목록 | 핵심 랜딩 페이지 |
| 2 | 지역 허브 (17개 시도) | 지역 키워드 SEO |
| 3 | 인기 여행지/캠핑장 상세 (상위 100개) | 롱테일 키워드 |
| 4 | 레시피 상세 | Rich Results (Recipe 스키마) |
| 5 | 나머지 상세 페이지 | 자연 크롤링 |

**canonical URL 정책:**
- 모든 페이지에 `canonical` URL 설정 (`generatePageMetadata`에서 자동)
- 한국어 페이지: `https://tripbite.kr/travel/abc123`
- 영어 페이지: `https://tripbite.kr/en/travel/abc123`
- 필터/정렬 쿼리 파라미터는 canonical에서 제외 (중복 색인 방지)

**noindex 정책:**
```typescript
// 색인 제외 대상
// - /api/* → robots.txt에서 이미 차단
// - /search?q=* → 검색 결과 페이지는 noindex (중복 콘텐츠 방지)
// - 에러 페이지 (404, 500)

// src/app/[locale]/search/page.tsx
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};
```

**크롤 버짓 최적화:**
- 불필요한 페이지 크롤링 차단 (`robots.txt`에서 `/api/` 차단)
- 페이지네이션: `?page=2` 이후 페이지는 `noindex, follow` 설정
- 캐시된 데이터로 빠른 응답 → 크롤러 체류 시간 최소화
- `<link rel="next/prev">` 대신 sitemap에 모든 상세 페이지 포함

### 5.3 Rich Results 대상

| 페이지 | 스키마 | Google Rich Results |
|--------|--------|-------------------|
| 레시피 상세 | Recipe | 레시피 카루셀, 조리 시간, 칼로리 표시 |
| 여행지 상세 | TouristAttraction | 평점 별표, 위치 정보 |
| 맛집 상세 | Restaurant | 평점 별표, 주소, 메뉴 |
| 캠핑장 상세 | Campground | 평점 별표, 시설 정보 |
| 홈 | WebSite + SearchAction | 사이트링크 검색창 |

> **검증**: Google Rich Results Test (https://search.google.com/test/rich-results)로 각 스키마 유효성 테스트

---

## 6. Google AdSense 승인 전략

### 6.1 승인 요건 충족 체크리스트

AdSense 승인을 위해 사이트가 갖춰야 할 조건:

**콘텐츠 품질:**
- [ ] 고유한 오리지널 콘텐츠 제공 (공공 API 데이터 + 자체 리뷰/큐레이션으로 차별화)
- [ ] 각 페이지에 충분한 텍스트 콘텐츠 (여행지 소개, 레시피 조리법, 캠핑장 시설 설명 등)
- [ ] 최소 20~30개 이상의 실질적 콘텐츠 페이지 (여행지/맛집/캠핑장 상세)
- [ ] 정기적으로 업데이트되는 콘텐츠 (24시간 캐시 갱신, 사용자 리뷰 축적)

**필수 페이지:**
- [ ] 개인정보처리방침 (Privacy Policy) 페이지 → `/[locale]/privacy`
- [ ] 이용약관 (Terms of Service) 페이지 → `/[locale]/terms`
- [ ] 소개 (About) 페이지 → `/[locale]/about`
- [ ] 연락처 (Contact) 정보 → 푸터 또는 별도 페이지

**사이트 구조:**
- [ ] 명확한 네비게이션 (Header 메뉴: 여행지, 맛집, 캠핑, 특산품, 레시피)
- [ ] 직관적인 사이트 구조 (홈 → 목록 → 상세의 3단계 계층)
- [ ] 모바일 반응형 디자인 (Tailwind CSS 반응형)
- [ ] 빠른 페이지 로드 속도 (Lighthouse Performance >90)
- [ ] HTTPS 적용 (Vercel 기본 제공)

**기술 요건:**
- [ ] 커스텀 도메인 연결 (`tripbite.kr`)
- [ ] robots.txt에서 AdSense 크롤러 허용
- [ ] 사이트 운영 기간 최소 1~3개월 (한국은 보통 제한 없음)
- [ ] Google Search Console 등록 및 색인 완료

### 6.2 AdSense 신청 전 필수 추가 페이지

```
src/app/[locale]/
├── privacy/
│   └── page.tsx        # 개인정보처리방침
├── terms/
│   └── page.tsx        # 이용약관
└── about/
    └── page.tsx        # 서비스 소개 + 연락처
```

**개인정보처리방침 포함 사항:**
- 수집하는 개인정보 항목 (Supabase Auth: 이메일)
- 쿠키 사용 안내 (Google AdSense 쿠키 포함)
- 제3자 광고 서비스 사용 고지 (Google AdSense)
- 데이터 보유 기간 및 삭제 방법

### 6.3 광고 배치 전략 (승인 후)

| 위치 | 광고 유형 | 페이지 |
|------|----------|--------|
| 목록 카드 사이 (매 4~6번째) | 인피드 광고 | 여행지/맛집/캠핑장 목록 |
| 상세 페이지 본문 중간 | 콘텐츠 내 광고 | 여행지/캠핑장 상세 |
| 상세 페이지 하단 (리뷰 위) | 디스플레이 광고 | 모든 상세 페이지 |
| 사이드바 (데스크톱) | 디스플레이 광고 | 목록/상세 (lg: 이상) |

**CWV 영향 최소화:**
- 광고 영역에 고정 높이 `min-height` 지정 → CLS 방지
- 광고 스크립트 `strategy="lazyOnload"` (next/script) → LCP 영향 최소화
- 첫 화면(above the fold)에 광고 과다 배치 금지
- `loading="lazy"` 광고 컨테이너 사용

```typescript
// src/components/ads/AdUnit.tsx (승인 후 구현)
'use client';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export function AdUnit({ slot, format = 'auto', className }: AdUnitProps) {
  return (
    <div className={cn('ad-container min-h-[250px]', className)}>
      <ins
        className="adsbygoogle"
        data-ad-client="ca-pub-XXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
```

### 6.4 AdSense 관련 주의사항

- 승인 전까지 광고 코드를 삽입하지 않음
- 자동 생성된 페이지(API 데이터만 나열)는 "부가가치 부족"으로 거절 사유 → 자체 리뷰, 큐레이션, 접근성 정보 등으로 오리지널 가치 추가
- 콘텐츠가 충분히 축적된 후 신청 (최소 20~30개 상세 페이지 + 리뷰 데이터)
- 한국어 + 영어 다국어 지원은 승인에 긍정적 (글로벌 트래픽 가능성)
