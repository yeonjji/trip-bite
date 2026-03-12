# 05-Design System

> **프로젝트**: 여행한입 (Trip Bite)
> **작성일**: 2026-03-11
> **버전**: 1.0

---

## 1. 디자인 원칙

1. **따뜻하고 친근한**: 오렌지/코랄 계열의 따뜻한 색감으로 여행의 설렘 전달
2. **사진 중심**: 여행지/음식 이미지가 주인공, UI는 콘텐츠를 돋보이게
3. **직관적**: 복잡한 네비게이션 없이 탐색 → 상세 → 행동의 명확한 흐름
4. **접근 가능**: WCAG 2.1 AA 준수, 모든 사용자가 동등하게 이용
5. **반응형**: 모바일 퍼스트, 모든 디바이스에서 최적의 경험

---

## 2. 컬러 팔레트

### 2.1 Primary Colors

| 이름 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| Primary | `#f97316` | `orange-500` | 주요 CTA, 강조, 브랜드 |
| Primary Light | `#fdba74` | `orange-300` | 호버 상태, 보조 강조 |
| Primary Dark | `#ea580c` | `orange-600` | 액티브 상태, 텍스트 링크 |
| Coral | `#ff6b6b` | custom | 보조 강조, 그래디언트 |

### 2.2 Secondary Colors

| 이름 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| Warm Background | `#fffbf5` | custom | 페이지 배경 |
| Amber Light | `#fef3c7` | `amber-100` | 카드 배경, 섹션 구분 |
| Amber | `#fbbf24` | `amber-400` | 별점, 강조 아이콘 |

### 2.3 Accent Colors

| 이름 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| Teal | `#14b8a6` | `teal-500` | CTA 버튼, 링크, 접근성 배지 |
| Teal Light | `#5eead4` | `teal-300` | 호버 상태 |
| Teal Dark | `#0d9488` | `teal-600` | 액티브 상태 |

### 2.4 Neutral Colors

| 이름 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| Text Primary | `#1f2937` | `gray-800` | 본문 텍스트 |
| Text Secondary | `#6b7280` | `gray-500` | 보조 텍스트, 캡션 |
| Text Tertiary | `#9ca3af` | `gray-400` | 플레이스홀더, 비활성 |
| Border | `#e5e7eb` | `gray-200` | 테두리, 구분선 |
| Surface | `#f9fafb` | `gray-50` | 카드 배경 (대체) |
| White | `#ffffff` | `white` | 카드, 모달 배경 |

### 2.5 Semantic Colors

| 이름 | Hex | 용도 |
|------|-----|------|
| Success | `#22c55e` (green-500) | 성공 메시지, 이용 가능 |
| Warning | `#f59e0b` (amber-500) | 경고, 주의 |
| Error | `#ef4444` (red-500) | 에러, 이용 불가 |
| Info | `#3b82f6` (blue-500) | 정보 안내 |

### 2.6 Tailwind v4 테마 설정

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary-50: #fff7ed;
  --color-primary-100: #ffedd5;
  --color-primary-200: #fed7aa;
  --color-primary-300: #fdba74;
  --color-primary-400: #fb923c;
  --color-primary-500: #f97316;
  --color-primary-600: #ea580c;
  --color-primary-700: #c2410c;
  --color-primary-800: #9a3412;
  --color-primary-900: #7c2d12;
  --color-coral: #ff6b6b;
  --color-background: #fffbf5;
  --color-accent: #14b8a6;
  --color-accent-light: #5eead4;
  --color-accent-dark: #0d9488;
  --font-sans: var(--font-pretendard);
  --radius-card: 1rem;
  --radius-button: 0.75rem;
}
```

> 참고: Tailwind CSS v4는 CSS-first 구성을 기본으로 사용한다. `tailwind.config.ts`는 필요한 경우에만 호환용으로 추가한다.

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

| 용도 | 폰트 | Fallback |
|------|------|----------|
| 본문/UI | Pretendard | system-ui, -apple-system, sans-serif |
| 숫자/코드 | Pretendard | monospace (고정폭 필요 시) |

**Next.js 폰트 설정:**
```typescript
// src/app/[locale]/layout.tsx
import localFont from 'next/font/local';

const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
});
```

### 3.2 타입 스케일

| 레벨 | 크기 (rem) | 픽셀 | 행간 | 용도 |
|------|-----------|------|------|------|
| Display | 2.25 | 36px | 1.2 | 히어로 타이틀 |
| H1 | 1.875 | 30px | 1.3 | 페이지 타이틀 |
| H2 | 1.5 | 24px | 1.3 | 섹션 타이틀 |
| H3 | 1.25 | 20px | 1.4 | 카드 타이틀, 서브섹션 |
| H4 | 1.125 | 18px | 1.4 | 소제목 |
| Body Large | 1.125 | 18px | 1.6 | 강조 본문 |
| Body | 1 | 16px | 1.6 | 기본 본문 |
| Body Small | 0.875 | 14px | 1.5 | 보조 텍스트, 캡션 |
| Caption | 0.75 | 12px | 1.5 | 메타 정보, 라벨 |

### 3.3 폰트 가중치

| 이름 | Weight | 용도 |
|------|--------|------|
| Regular | 400 | 본문 |
| Medium | 500 | 라벨, 네비게이션 |
| SemiBold | 600 | 카드 타이틀, 버튼 |
| Bold | 700 | 페이지/섹션 타이틀 |

---

## 4. 레이아웃 및 스페이싱

### 4.1 그리드 시스템

| 브레이크포인트 | 컬럼 수 | 거터 | 최대 너비 |
|-------------|---------|------|----------|
| Mobile (<640px) | 1~2 | 16px | 100% |
| Tablet (640~1024px) | 2~3 | 24px | 100% |
| Desktop (1024~1280px) | 3~4 | 32px | 1280px |
| Wide (>1280px) | 4 | 32px | 1440px |

### 4.2 스페이싱 스케일

Tailwind 기본 스페이싱 (4px 단위) 사용:

| Token | 값 | 용도 |
|-------|-----|------|
| `space-1` | 4px | 아이콘과 텍스트 사이 |
| `space-2` | 8px | 요소 내 패딩 |
| `space-3` | 12px | 작은 갭 |
| `space-4` | 16px | 카드 내 패딩 |
| `space-5` | 20px | 카드 내 패딩 (넓음) |
| `space-6` | 24px | 섹션 내 요소 간격 |
| `space-8` | 32px | 섹션 간 간격 |
| `space-12` | 48px | 대 섹션 간 간격 |
| `space-16` | 64px | 페이지 상하 패딩 |

### 4.3 Border Radius

| Token | 값 | Tailwind | 용도 |
|-------|-----|----------|------|
| Small | 8px | `rounded-lg` | 입력 필드, 배지 |
| Medium | 12px | `rounded-xl` | 버튼 |
| Large | 16px | `rounded-2xl` | 카드 |
| Full | 9999px | `rounded-full` | 아바타, 칩 |

---

## 5. 컴포넌트 명세

### 5.1 Navigation

**Header (Desktop)**
```
┌─────────────────────────────────────────────────────────┐
│ [Logo] 여행한입    여행지  맛집  특산품  레시피  [🔍] [🌐 KO] │
└─────────────────────────────────────────────────────────┘
```
- 높이: 64px
- 배경: white, 하단 border gray-200
- 스크롤 시 sticky + backdrop-blur
- 언어 전환 버튼 (KO/EN)

**MobileNav (Bottom Tab)**
```
┌───────────────────────────────────┐
│  🏠 홈   🗺 여행   🍽 맛집   🔍 검색  │
└───────────────────────────────────┘
```
- 높이: 56px + safe-area-inset-bottom
- 배경: white, 상단 border
- 활성 탭: primary 색상

**Footer**
- 배경: gray-800
- 텍스트: white/gray-400
- 섹션: 서비스 소개, 바로가기, 데이터 출처, 저작권

### 5.2 Cards

**TravelCard / RestaurantCard**
```
┌──────────────────────┐
│                      │
│    [이미지 16:9]      │
│                      │
├──────────────────────┤
│ ⭐ 4.5 (123)         │
│ 경복궁                │
│ 서울특별시 종로구       │
│ [🐾] [♿] [🌐]       │
└──────────────────────┘
```
- 크기: 반응형 (모바일 100%, 태블릿 50%, 데스크톱 25~33%)
- 이미지: 16:9 비율, `object-cover`, 로딩 시 스켈레톤
- 카드 radius: 16px (`rounded-2xl`)
- 그림자: `shadow-sm`, 호버 시 `shadow-md` + 약간 위로 이동
- 접근성 배지: 카드 하단에 아이콘 배지 표시
- 평점: 별 아이콘 + 숫자 + 리뷰 수

**SpecialtyCard**
```
┌──────────────────────┐
│                      │
│   [이미지 1:1]        │
│                      │
├──────────────────────┤
│ 제주 감귤              │
│ 제주특별자치도          │
│ 🏷 겨울 제철           │
└──────────────────────┘
```
- 이미지: 1:1 정사각형
- 제철 배지: 하단에 시즌 태그

**RecipeCard**
```
┌──────────────────────┐
│                      │
│    [이미지 16:9]      │
│                      │
├──────────────────────┤
│ 김치찌개              │
│ ⏱ 30분  👤 2인분     │
│ 🔥 431kcal  난이도 쉬움│
└──────────────────────┘
```
- 메타 정보: 조리시간, 인분, 칼로리, 난이도

**CampingCard**
```
┌──────────────────────┐
│                      │
│    [이미지 16:9]      │
│                      │
├──────────────────────┤
│ ⭐ 4.3 (45)          │
│ 서울숲 캠핑장          │
│ 서울특별시 성동구       │
│ [⛺ 일반] [🔥 화로대]  │
│ [🐾 소형견] [전기] [WiFi]│
│ 잔디 20 · 데크 10      │
└──────────────────────┘
```
- 크기: 반응형 (모바일 100%, 태블릿 50%, 데스크톱 25~33%)
- 이미지: 16:9 비율, `object-cover`, 로딩 시 스켈레톤
- 카드 radius: 16px (`rounded-2xl`)
- 그림자: `shadow-sm`, 호버 시 `shadow-md` + 약간 위로 이동
- 업종 배지: 카드 하단에 업종 아이콘 배지 표시
- 시설 배지: 주요 부대시설 아이콘 (최대 4개, 넘으면 +N)
- 사이트 요약: 바닥 타입별 사이트 수 한 줄 표시
- 평점: 별 아이콘 + 숫자 + 리뷰 수

### 5.3 Filters

**RegionFilter**
- 타입: 수평 스크롤 칩 (모바일), 드롭다운 (데스크톱)
- 옵션: 전체 + 17개 시도
- 활성 칩: primary 배경 + white 텍스트

**ThemeFilter**
- 타입: 수평 스크롤 칩
- 옵션: 관광지, 문화시설, 축제, 여행코스, 레포츠, 음식점

**TargetGroupFilter**
- 타입: 토글 버튼 그룹
- 옵션: 반려동물 동반, 휠체어 접근, 외국인 친화, 고령자, 유아

**CampingFilter**
- 업종 필터
  - 타입: 수평 스크롤 칩
  - 옵션: 전체, 일반야영장, 자동차야영장, 글램핑, 카라반
  - 활성 칩: primary 배경 + white 텍스트

- 부대시설 필터
  - 타입: 체크박스 그룹 (드롭다운 내)
  - 옵션: 전기, 무선인터넷, 장작판매, 온수, 놀이터, 산책로, 수영장, 마트/편의점
  - 다중 선택 가능

- 반려동물 필터
  - 타입: 토글 버튼
  - 옵션: 전체, 가능, 소형견만
  - 색상: teal-500

- 바닥 타입 필터
  - 타입: 체크박스 그룹
  - 옵션: 잔디, 파쇄석, 데크, 자갈, 맨흙
  - 다중 선택 가능

- 운영 시즌 필터
  - 타입: 칩 (다중 선택)
  - 옵션: 봄, 여름, 가을, 겨울

### 5.4 Badges

**AccessibilityBadge**
| 대상 | 아이콘 | 색상 | 라벨 |
|------|--------|------|------|
| 반려동물 | 🐾 | teal-500 | 반려동물 동반 |
| 휠체어 | ♿ | blue-500 | 휠체어 접근 가능 |
| 외국인 | 🌐 | purple-500 | 외국어 지원 |
| 고령자 | 👴 | amber-500 | 고령자 친화 |
| 유아 | 👶 | pink-500 | 유아 동반 |

- 크기: Small (20px), Medium (28px)
- 스타일: 둥근 아이콘 + 툴팁 (호버 시 상세)

**CampingBadge**
| 대상 | 아이콘 | 색상 | 라벨 |
|------|--------|------|------|
| 일반야영장 | ⛺ | green-600 | 일반야영장 |
| 자동차야영장 | 🚗 | blue-600 | 자동차야영장 |
| 글램핑 | 🏕 | purple-500 | 글램핑 |
| 카라반 | 🚐 | orange-500 | 카라반 |
| 화로대 개별 | 🔥 | red-500 | 화로대 개별 |
| 반려동물 가능 | 🐾 | teal-500 | 반려동물 |

- 크기: Small (20px), Medium (28px)
- 스타일: 둥근 아이콘 + 툴팁 (호버 시 상세)

### 5.5 SearchBar

```
┌──────────────────────────────────────┐
│ 🔍 여행지, 맛집, 특산품을 검색하세요... │
└──────────────────────────────────────┘
```
- 높이: 48px (일반), 56px (히어로)
- Radius: 12px (`rounded-xl`)
- 아이콘: 좌측 돋보기
- 배경: white + border gray-200
- 포커스: border primary + ring

### 5.6 WeatherWidget

```
┌─────────────────────┐
│ 서울 ☀️ 15°C        │
│ 오늘 5° / 17°       │
├─────────────────────┤
│ 내일  ⛅  6° / 18°  │
│ 모레  🌧  4° / 12°  │
│ 글피  ☀️  7° / 19°  │
└─────────────────────┘
```
- 컴팩트 모드 (카드 내) / 확장 모드 (상세 페이지)
- 날씨 아이콘: SVG 또는 이모지

### 5.7 Rating

```
⭐⭐⭐⭐☆ 4.2 (156개 리뷰)
```
- 별: 5개 (채워진/빈 별)
- 소수점 지원 (반별)
- 리뷰 수 텍스트

### 5.8 ImageGallery

- 메인 이미지: 16:9 풀 너비
- 썸네일 하단: 수평 스크롤
- 클릭 시 라이트박스 (Dialog)
- 스와이프 지원 (모바일)

### 5.9 Skeleton / Loading

- 카드: 이미지 영역 + 텍스트 라인 2~3개
- 상세 페이지: 이미지 + 텍스트 블록
- 색상: gray-200 → gray-300 애니메이션 (`animate-pulse`)

### 5.10 EmptyState

```
┌─────────────────────┐
│                     │
│     [일러스트]       │
│                     │
│  검색 결과가 없어요    │
│  다른 키워드로         │
│  검색해보세요          │
│                     │
│  [홈으로 돌아가기]     │
└─────────────────────┘
```

---

## 6. 반응형 브레이크포인트

| 이름 | Tailwind Prefix | 범위 | 레이아웃 |
|------|----------------|------|---------|
| Mobile | (기본) | 0~639px | 1열, 하단 네비게이션 |
| Tablet | `sm:` | 640~767px | 2열 그리드 |
| Tablet Large | `md:` | 768~1023px | 2~3열 그리드 |
| Desktop | `lg:` | 1024~1279px | 3~4열, 사이드바 가능 |
| Wide | `xl:` | 1280px+ | 4열, 최대 너비 제한 |

### 반응형 카드 그리드 패턴

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  <!-- Cards -->
</div>
```

---

## 7. 접근성 가이드라인

### 7.1 색상 대비

| 조합 | 대비 비율 | 기준 |
|------|----------|------|
| gray-800 on white | 12.6:1 | AAA (본문) |
| gray-800 on background (#fffbf5) | 12.2:1 | AAA (본문) |
| gray-500 on white | 4.6:1 | AA (보조 텍스트) |
| white on primary (#f97316) | 3.1:1 | AA Large (버튼 텍스트) |
| white on teal-500 (#14b8a6) | 3.2:1 | AA Large (CTA 버튼) |
| white on gray-800 | 12.6:1 | AAA (푸터) |

### 7.2 키보드 네비게이션

- 모든 인터랙티브 요소에 `tabIndex` + 포커스 스타일
- 포커스 링: `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`
- Skip to content 링크 (최상단)
- 모달/다이얼로그: focus trap
- ESC 키로 모달/메뉴 닫기

### 7.3 스크린 리더

- 의미 있는 이미지: `alt` 텍스트 필수
- 장식 이미지: `alt=""` + `aria-hidden="true"`
- 아이콘 버튼: `aria-label` 필수
- 접근성 배지: `aria-label`로 상세 설명
- 동적 콘텐츠 변경: `aria-live` 영역
- 페이지 타이틀: 각 페이지별 고유 `<title>`

### 7.4 모션 및 애니메이션

- `prefers-reduced-motion` 미디어 쿼리 존중
- 필수 애니메이션만 유지 (스켈레톤 로딩)
- 자동 재생 캐러셀: 정지 버튼 필수

### 7.5 터치 타겟

- 최소 터치 타겟: 44x44px (WCAG 2.5.5)
- 버튼 간 최소 간격: 8px

---

## 8. 아이코노그래피

- 아이콘 라이브러리: Lucide Icons (shadcn/ui 기본)
- 크기: 16px (인라인), 20px (버튼 내), 24px (독립)
- 색상: `currentColor` (텍스트 색상 상속)
- 접근성 배지 아이콘: 커스텀 SVG 또는 이모지

---

## 9. 그림자 및 높이

| 레벨 | Tailwind | 값 | 용도 |
|------|----------|-----|------|
| 0 | - | none | 기본 상태 |
| 1 | `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | 카드 기본 |
| 2 | `shadow-md` | 0 4px 6px rgba(0,0,0,0.07) | 카드 호버, 드롭다운 |
| 3 | `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | 모달, 플로팅 |
| 4 | `shadow-xl` | 0 20px 25px rgba(0,0,0,0.1) | 다이얼로그 |
