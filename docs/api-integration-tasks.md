# 5개 공공데이터 API 통합 — 태스크 목록

## Phase 1: 기반 작업

### Task 1-1: 환경변수 설정
- [x] `.env.local`에 `KCISA_CITYTOUR_API_KEY=701ff27c-3d8e-4a15-aa1b-a6b45594dddc` 추가
- [x] `.env.local`에 `KCISA_EV_API_KEY=ef823f32-01c4-4765-beb4-49eefd44d2a6` 추가
- [x] `.env.example`에 `KCISA_CITYTOUR_API_KEY`, `KCISA_EV_API_KEY` 추가
- [x] `next.config.ts` images.remotePatterns에 `api.kcisa.kr` 추가

### Task 1-2: i18n 메시지 추가
- [x] `messages/ko.json`에 nav(amenities, evCharging, audioGuide, recreation, autoCamping), 각 페이지별 키 추가
- [x] `messages/en.json`에 동일 구조 영문 키 추가

---

## Phase 2: 휴양시설 + 자동차야영장

### Task 2-1: 휴양시설 — DB
- [ ] `supabase/migrations/019_recreation_facilities.sql` 작성 (ac_year, sido_name, area_code, ent_name, title, content, filename1-3, link, reg_date, timestamps, RLS)
- [ ] Supabase에 migration 실행

### Task 2-2: 휴양시설 — API 클라이언트 + Sync
- [ ] `npm install fast-xml-parser` (XML 파싱용)
- [ ] `src/types/recreation-facility.ts` 타입 정의
- [ ] `src/lib/api/recreation-api.ts` 작성 (endpoint: `apis.data.go.kr/B551982/openApiOrgOperRest2/openXmlOrgOperRest`, XML 파싱)
- [ ] `scripts/sync-recreation-facilities.mjs` 작성 (SIDO_NAME→area_code 매핑, upsert)
- [ ] sync 스크립트 실행 → 데이터 확인

### Task 2-3: 휴양시설 — 데이터 함수 + 페이지
- [ ] `src/lib/data/recreation-facilities.ts` 작성 (getRecreationFacilities, getRecreationFacilityDetail)
- [ ] `src/components/cards/RecreationCard.tsx` 작성
- [ ] `src/app/[locale]/travel/recreation/page.tsx` 작성 (listing, filters, pagination)
- [ ] `src/app/[locale]/travel/recreation/[id]/page.tsx` 작성 (detail)
- [ ] 페이지 동작 확인

### Task 2-4: 자동차야영장 — DB
- [ ] 자동차야영장 API 테스트 호출로 응답 필드 확인 (`https://apis.data.go.kr/1741000/auto_campgrounds`)
- [ ] `supabase/migrations/020_auto_camping_businesses.sql` 작성 (API 응답 기반 컬럼, area_code, location geography, RLS)
- [ ] Supabase에 migration 실행

### Task 2-5: 자동차야영장 — API 클라이언트 + Sync
- [ ] `src/types/auto-camping.ts` 타입 정의
- [ ] `src/lib/api/auto-camping-api.ts` 작성
- [ ] `scripts/sync-auto-camping.mjs` 작성 (주소→area_code 매핑)
- [ ] sync 스크립트 실행 → 데이터 확인

### Task 2-6: 자동차야영장 — 데이터 함수 + 페이지
- [ ] `src/lib/data/auto-camping.ts` 작성 (getAutoCampingBusinesses, getAutoCampingDetail)
- [ ] `src/components/cards/AutoCampingCard.tsx` 작성
- [ ] `src/app/[locale]/travel/auto-camping/page.tsx` 작성
- [ ] `src/app/[locale]/travel/auto-camping/[id]/page.tsx` 작성
- [ ] 페이지 동작 확인

### Task 2-7: Header 수정 — 여행 드롭다운
- [ ] `src/components/layout/Header.tsx` travel NavDropdown에 recreation, autoCamping 항목 추가
- [ ] 네비게이션 동작 확인

### Task 2-8: Phase 2 검증
- [ ] `npm run build` 성공
- [ ] `/ko/travel/recreation` 접속 + 필터 + 페이지네이션
- [ ] `/ko/travel/auto-camping` 접속 + 필터 + 페이지네이션
- [ ] `/en/travel/recreation`, `/en/travel/auto-camping` 영문 확인

---

## Phase 3: 시티투어 맛집 + 전기차충전소

### Task 3-1: KCISA API 클라이언트
- [ ] `src/lib/api/kcisa-api.ts` 작성 (시티투어 `API_CNV_063` + EV `API_CNV_062` 공유 클라이언트, resultCode "0000" 체크)

### Task 3-2: 시티투어 맛집 — DB
- [ ] `supabase/migrations/021_city_tour_restaurants.sql` 작성 (tour_title, rstr_nm, rstr_cl_nm, rstr_road_addr, area_code, location, mapx/mapy, unique composite index)
- [ ] Supabase에 migration 실행

### Task 3-3: 시티투어 맛집 — Sync
- [ ] `src/types/city-tour-restaurant.ts` 타입 정의
- [ ] `scripts/sync-city-tour-restaurants.mjs` 작성 (17개 시도명 순회, SIDO_NAME→area_code 매핑, composite upsert)
- [ ] sync 스크립트 실행 → 데이터 확인

### Task 3-4: 시티투어 맛집 — 데이터 함수 + 맛집 페이지 수정
- [ ] `src/lib/data/city-tour-restaurants.ts` 작성
- [ ] `src/components/cards/CityTourRestaurantCard.tsx` 작성
- [ ] `src/app/[locale]/restaurants/_components/RestaurantSourceTabs.tsx` 작성 (탭 UI)
- [ ] `src/app/[locale]/restaurants/page.tsx` 수정 (`?source=tour|citytour` 지원)
- [ ] 맛집 페이지 탭 전환 동작 확인

### Task 3-5: 전기차충전소 — DB
- [ ] `supabase/migrations/022_ev_charging_stations.sql` 작성 (trat_nm, chrg_stat_nm, road_nm_addr, 관광지/충전소 좌표, area_code, location)
- [ ] Supabase에 migration 실행

### Task 3-6: 전기차충전소 — Sync
- [ ] `src/types/ev-charging.ts` 타입 정의
- [ ] `scripts/sync-ev-charging.mjs` 작성 (지역명 순회, 좌표 파싱)
- [ ] sync 스크립트 실행 → 데이터 확인

### Task 3-7: 전기차충전소 — 데이터 함수 + 페이지
- [ ] `src/lib/data/ev-charging.ts` 작성
- [ ] `src/components/cards/EvChargingCard.tsx` 작성
- [ ] `src/app/[locale]/amenities/page.tsx` 작성 (편의시설 허브)
- [ ] `src/app/[locale]/amenities/ev-charging/page.tsx` 작성
- [ ] `src/app/[locale]/amenities/ev-charging/[id]/page.tsx` 작성
- [ ] 페이지 동작 확인

### Task 3-8: Header 수정 — 편의시설 NavDropdown
- [ ] `src/components/layout/Header.tsx`에 amenities NavDropdown 추가 (evCharging, audioGuide)
- [ ] 네비게이션 동작 확인

### Task 3-9: Phase 3 검증
- [ ] `npm run build` 성공
- [ ] `/ko/restaurants?source=citytour` 탭 전환
- [ ] `/ko/amenities` 허브 페이지
- [ ] `/ko/amenities/ev-charging` 접속 + 필터 + 페이지네이션
- [ ] 영문 페이지 확인

---

## Phase 4: 오디오 가이드

### Task 4-1: 오디오 가이드 — DB
- [ ] `supabase/migrations/023_audio_guides.sql` 작성 (tid, stid, title, area_code, location, image_url, lang_code, audio_title, script, play_time, audio_url, unique on (tid, stid, lang_code))
- [ ] Supabase에 migration 실행

### Task 4-2: 오디오 가이드 — API 클라이언트 + Sync
- [ ] `src/types/audio-guide.ts` 타입 정의
- [ ] `src/lib/api/odii-api.ts` 작성 (resultCode "00" 체크!, langCode 파라미터)
- [ ] `scripts/sync-audio-guides.mjs` 작성 (2단계: themeBasedList → storyBasedList, addr1→area_code)
- [ ] sync 스크립트 실행 → 데이터 확인

### Task 4-3: 오디오 가이드 — 데이터 함수 + 페이지
- [ ] `src/lib/data/audio-guides.ts` 작성
- [ ] `src/components/audio/AudioPlayer.tsx` 작성 (HTML5 audio)
- [ ] `src/components/cards/AudioGuideCard.tsx` 작성
- [ ] `src/app/[locale]/amenities/audio-guide/page.tsx` 작성
- [ ] `src/app/[locale]/amenities/audio-guide/[tid]/page.tsx` 작성 (상세 + 오디오 플레이어)
- [ ] 오디오 재생 동작 확인

### Task 4-4: Phase 4 검증
- [ ] `npm run build` 성공
- [ ] `/ko/amenities/audio-guide` 접속 + 필터 + 페이지네이션
- [ ] 오디오 가이드 상세 → 재생 버튼 동작
- [ ] `/en/amenities/audio-guide` 영문 확인

---

## 최종 검증

- [ ] 전체 `npm run build` 성공
- [ ] 전체 `npm run lint` 통과
- [ ] 모든 페이지 한국어/영문 전환 확인
- [ ] Header 네비게이션: 여행 드롭다운 (휴양시설, 자동차야영장), 편의시설 드롭다운 (전기차충전소, 오디오가이드)
- [ ] 맛집 페이지 탭 전환 (TourAPI / 시티투어)
- [ ] region 허브 페이지에 새 데이터 소스 반영 여부 결정
