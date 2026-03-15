# 5개 공공데이터 API 통합 작업 문서

## 개요

Trip Bite에 5개 새로운 공공데이터 API를 통합합니다. 기존 sync 스크립트 → Supabase → 데이터 함수 → 페이지 패턴을 그대로 따릅니다.

### 배치 구조

| 데이터 | 위치 | 설명 |
|--------|------|------|
| 시티투어 맛집 | 기존 `/restaurants` 페이지에 탭 통합 | TourAPI 맛집 / 시티투어 맛집 전환 |
| 휴양시설 | `/travel/recreation` | 여행 카테고리 하위 |
| 자동차야영장 | `/travel/auto-camping` | 여행 카테고리 하위 |
| 전기차충전소 | `/amenities/ev-charging` | 새 편의시설 카테고리 |
| 오디오가이드 | `/amenities/audio-guide` | 새 편의시설 카테고리 |

---

## API 신청/문서 URL

| API | URL |
|-----|-----|
| 시티투어 코스 맛집 | https://www.data.go.kr/data/15124908/openapi.do → https://www.culture.go.kr/data/openapi/openapiView.do?id=603 |
| 관광지 주변 전기차충전소 | https://www.culture.go.kr/data/openapi/openapiView.do?id=599 |
| 관광지 오디오 가이드 (Odii) | https://www.data.go.kr/data/15101971/openapi.do |
| 기관운영휴양시설 | https://www.data.go.kr/data/15061196/openapi.do |
| 자동차야영장업 | https://www.data.go.kr/iim/api/selectAPIAcountView.do |

---

## API 키 정리

| API | 환경변수 | 키 |
|-----|---------|-----|
| 시티투어 맛집 (KCISA) | `KCISA_CITYTOUR_API_KEY` | `701ff27c-3d8e-4a15-aa1b-a6b45594dddc` |
| 전기차충전소 (KCISA) | `KCISA_EV_API_KEY` | `ef823f32-01c4-4765-beb4-49eefd44d2a6` |
| 오디오 가이드 (Odii) | `TOUR_API_KEY` (기존) | 공공데이터포털 키 |
| 휴양시설 | `TOUR_API_KEY` (기존) | 공공데이터포털 키 |
| 자동차야영장 | `TOUR_API_KEY` (기존) | 공공데이터포털 키 |

---

## Phase 1: 기반 작업

### 1-1. 환경변수

`.env.local`에 추가:
```
KCISA_CITYTOUR_API_KEY=701ff27c-3d8e-4a15-aa1b-a6b45594dddc
KCISA_EV_API_KEY=ef823f32-01c4-4765-beb4-49eefd44d2a6
```

`.env.example` 업데이트, `next.config.ts`에 `api.kcisa.kr` 이미지 도메인 추가.

### 1-2. i18n 메시지

`messages/ko.json`, `messages/en.json`에 다음 키 추가:
- nav: amenities, evCharging, audioGuide, recreation, autoCamping
- 각 페이지별: title, description, 고유 필드 라벨

---

## Phase 2: 휴양시설 + 자동차야영장 (여행 카테고리)

### 2-1. 휴양시설 (기관운영휴양시설)

**API 스펙:**
| 항목 | 값 |
|------|-----|
| Endpoint | `https://apis.data.go.kr/B551982/openApiOrgOperRest2/openXmlOrgOperRest` |
| 키 | `TOUR_API_KEY` (공공데이터포털) |
| Params | serviceKey, pageNo, numOfRows, ac_year, from_month, to_month, type, sidoCd |
| 응답 형식 | XML |
| 주요 응답 필드 | AC_YEAR, SIDO_NAME, ENT_NAME, TITLE, CONTENT, FILENAME1-3, LINK, REG_DATE |
| 특이사항 | 좌표 없음, 텍스트 기반 데이터 |

**만들 파일:**

| 파일 | 설명 |
|------|------|
| `supabase/migrations/019_recreation_facilities.sql` | 테이블 (ac_year, sido_name, area_code, ent_name, title, content, filename1-3, link, reg_date) |
| `src/types/recreation-facility.ts` | TypeScript 인터페이스 |
| `src/lib/api/recreation-api.ts` | API 클라이언트 (XML 파싱, `fast-xml-parser` 사용) |
| `scripts/sync-recreation-facilities.mjs` | Sync 스크립트 (SIDO_NAME → area_code 매핑) |
| `src/lib/data/recreation-facilities.ts` | 데이터 함수 |
| `src/app/[locale]/travel/recreation/page.tsx` | 목록 페이지 |
| `src/app/[locale]/travel/recreation/[id]/page.tsx` | 상세 페이지 |
| `src/components/cards/RecreationCard.tsx` | 카드 컴포넌트 (텍스트 기반) |

### 2-2. 자동차야영장

**API 스펙:**
| 항목 | 값 |
|------|-----|
| Endpoint | `https://apis.data.go.kr/1741000/auto_campgrounds` |
| 키 | `TOUR_API_KEY` (공공데이터포털) |
| Params | 공공데이터포털 표준 (serviceKey, numOfRows, pageNo, _type 등) |
| 응답 형식 | JSON (예상) |
| 특이사항 | 정확한 파라미터/응답 필드는 구현 시 테스트 호출로 확인 필요 |

**만들 파일:**

| 파일 | 설명 |
|------|------|
| `supabase/migrations/020_auto_camping_businesses.sql` | 테이블 (API 응답 기반 컬럼, area_code, location geography) |
| `src/types/auto-camping.ts` | TypeScript 인터페이스 |
| `src/lib/api/auto-camping-api.ts` | API 클라이언트 |
| `scripts/sync-auto-camping.mjs` | Sync 스크립트 (주소 → area_code 매핑) |
| `src/lib/data/auto-camping.ts` | 데이터 함수 |
| `src/app/[locale]/travel/auto-camping/page.tsx` | 목록 페이지 |
| `src/app/[locale]/travel/auto-camping/[id]/page.tsx` | 상세 페이지 |
| `src/components/cards/AutoCampingCard.tsx` | 카드 컴포넌트 (업소명, 주소, 상태 배지) |

### 2-3. Header 수정

`src/components/layout/Header.tsx`의 travel NavDropdown에 추가:
```tsx
{ href: "/travel/recreation", label: t("recreation") },
{ href: "/travel/auto-camping", label: t("autoCamping") },
```

---

## Phase 3: KCISA APIs (시티투어 맛집 + 전기차충전소)

### 3-1. 시티투어 맛집

**API 스펙:**
| 항목 | 값 |
|------|-----|
| Endpoint | `https://api.kcisa.kr/openapi/API_CNV_063/request` |
| 키 | `KCISA_CITYTOUR_API_KEY` |
| Params | serviceKey, numOfRows, pageNo, areaNm(시도명 2자이상), clNm(식당분류: 한식/분식/치킨/동양식/서양식/패스트푸드/뷔페/퓨전) |
| 응답 (20컬럼) | title(시티투어명), rstrNm(식당명), rstrBhfNm(지점명), rstrClNm(분류), rstrRoadAddr(도로명주소), rstrLnbrAddr(지번), rstrLatPos(위도), rstrLotPos(경도), rstrPnu, rstrGidCd, rstrInfoStdDt 등 |
| 성공 코드 | resultCode "0000" |

**만들 파일:**

| 파일 | 설명 |
|------|------|
| `supabase/migrations/021_city_tour_restaurants.sql` | 테이블 (tour_title, rstr_nm, rstr_cl_nm, rstr_road_addr, area_code, location, mapx/mapy) unique on (tour_title, rstr_nm, rstr_road_addr) |
| `src/types/city-tour-restaurant.ts` | TypeScript 인터페이스 |
| `src/lib/api/kcisa-api.ts` | KCISA 전용 클라이언트 (시티투어 + EV 공유) |
| `scripts/sync-city-tour-restaurants.mjs` | Sync 스크립트 (17개 시도명 순회) |
| `src/lib/data/city-tour-restaurants.ts` | 데이터 함수 |
| `src/components/cards/CityTourRestaurantCard.tsx` | 카드 컴포넌트 |

**기존 맛집 페이지 수정:**
- `src/app/[locale]/restaurants/page.tsx`: `?source=tour|citytour` searchParam 추가
- 새 컴포넌트: `RestaurantSourceTabs.tsx` (탭 UI로 전환)

### 3-2. 전기차충전소

**API 스펙:**
| 항목 | 값 |
|------|-----|
| Endpoint | `https://api.kcisa.kr/openapi/API_CNV_062/request` |
| 키 | `KCISA_EV_API_KEY` |
| Params | serviceKey, numOfRows, pageNo, tratNm(관광지명 2자이상), addr(주소 2자이상), dist(인접거리 KM) |
| 응답 (16컬럼) | tratNm(관광지명), roadNmAddr(도로명), lotnoAddr(지번), latPos/lotPos(관광지 위경도), tratCn(시설정보), prkgPsbltyNum(주차가능대수), tratGdncExpln(소개), mngInstNm(관리기관), mngInstTelno(전화), chrgCtpvNm(충전소지역), chrgStatNm(충전소명), chrgLatPos/chrgLotPos(충전소 위경도), dist(거리KM), dataCrtrYmd |
| 성공 코드 | resultCode "0000" |

**만들 파일:**

| 파일 | 설명 |
|------|------|
| `supabase/migrations/022_ev_charging_stations.sql` | 테이블 (trat_nm, chrg_stat_nm, road_nm_addr, 관광지/충전소 좌표, area_code, location) |
| `src/types/ev-charging.ts` | TypeScript 인터페이스 |
| `src/lib/api/kcisa-api.ts`에 추가 | kcisaEvApi.search() |
| `scripts/sync-ev-charging.mjs` | Sync 스크립트 (지역명 순회) |
| `src/lib/data/ev-charging.ts` | 데이터 함수 |
| `src/app/[locale]/amenities/page.tsx` | 편의시설 허브 페이지 |
| `src/app/[locale]/amenities/ev-charging/page.tsx` | 목록 페이지 |
| `src/app/[locale]/amenities/ev-charging/[id]/page.tsx` | 상세 페이지 |
| `src/components/cards/EvChargingCard.tsx` | 카드 컴포넌트 |

### 3-3. Header에 편의시설 NavDropdown 추가

```tsx
<NavDropdown
  label={t("amenities")}
  locale={locale}
  items={[
    { href: "/amenities/ev-charging", label: t("evCharging") },
    { href: "/amenities/audio-guide", label: t("audioGuide") },
  ]}
/>
```

---

## Phase 4: 오디오 가이드 (Odii)

### API 스펙:
| 항목 | 값 |
|------|-----|
| Base URL | `https://apis.data.go.kr/B551011/Odii` |
| 키 | `TOUR_API_KEY` (기존) |
| Operations | themeBasedList, themeLocationBasedList, themeSearchList, themeBasedSyncList, storyBasedList, storyLocationBasedList, storySearchList, storyBasedSyncList |
| Params | MobileOS, MobileApp, serviceKey, langCode(ko/en/cn1/jp), numOfRows, pageNo, _type |
| Theme 응답 | tid, tlid, themeCategory, addr1, addr2, title, mapX, mapY, langCheck, imageUrl, createdtime, modifiedtime |
| Story 응답 | stid, stlid, audioTitle, script, playTime, audioUrl (+ theme 필드 전부) |
| 성공 코드 | **"00"** (TourAPI "0000"과 다름!) |

**만들 파일:**

| 파일 | 설명 |
|------|------|
| `supabase/migrations/023_audio_guides.sql` | 테이블 (tid, stid, title, area_code, location, image_url, lang_code, audio_title, script, play_time, audio_url) unique on (tid, stid, lang_code) |
| `src/types/audio-guide.ts` | TypeScript 인터페이스 |
| `src/lib/api/odii-api.ts` | API 클라이언트 (resultCode "00" 체크!) |
| `scripts/sync-audio-guides.mjs` | Sync 스크립트 (2단계: themes → stories) |
| `src/lib/data/audio-guides.ts` | 데이터 함수 |
| `src/components/audio/AudioPlayer.tsx` | HTML5 오디오 플레이어 |
| `src/app/[locale]/amenities/audio-guide/page.tsx` | 목록 페이지 |
| `src/app/[locale]/amenities/audio-guide/[tid]/page.tsx` | 상세 + 오디오 플레이어 |
| `src/components/cards/AudioGuideCard.tsx` | 카드 (이미지 + 재생 아이콘 + 테마 배지) |

---

## 주의사항

1. **KCISA composite unique key**: 단일 ID 없음. Supabase JS `onConflict`가 복합키 미지원 시 `rpc`로 raw SQL ON CONFLICT 사용
2. **자동차야영장 API 스펙 확인 필요**: endpoint의 정확한 operation, 파라미터, 응답 필드를 구현 시 테스트 호출로 확인
3. **휴양시설 XML 응답**: `fast-xml-parser` 패키지 설치 필요 (sync 스크립트에서만 사용)
4. **Odii resultCode**: "00" ≠ TourAPI "0000" — tour-api.ts 재사용 불가, 별도 클라이언트 필수
5. **area_code 매핑**: KCISA는 지역명 사용 → `SIDO_NAME_TO_AREA_CODE` 매핑 필요 (기존 `src/lib/constants/area-codes.ts` 참조)

---

## 참조 (기존 코드 패턴)

| 용도 | 참조 파일 |
|------|----------|
| Sync 스크립트 | `scripts/sync-pet-places.mjs` |
| API 클라이언트 | `src/lib/api/camping-api.ts` |
| DB Migration | `supabase/migrations/015_pet_friendly_places.sql` |
| 페이지 패턴 | `src/app/[locale]/travel/pet/page.tsx` |
| 데이터 함수 | `src/lib/data/pet-places.ts` |
| Header | `src/components/layout/Header.tsx` |

---

## 검증 체크리스트

- [ ] 각 Phase 완료 후 `npm run build` 성공
- [ ] 각 sync 스크립트 실행 → Supabase 테이블 데이터 확인
- [ ] `/ko/travel/recreation` 페이지 동작
- [ ] `/ko/travel/auto-camping` 페이지 동작
- [ ] `/ko/restaurants?source=citytour` 탭 전환 동작
- [ ] `/ko/amenities/ev-charging` 페이지 동작
- [ ] `/ko/amenities/audio-guide` 페이지 + 오디오 재생 동작
- [ ] 필터(지역, 카테고리) 동작
- [ ] 페이지네이션 동작
- [ ] `/en/...` 영문 페이지 동작
