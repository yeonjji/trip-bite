# 09-API Keys Guide (API 키 발급 및 연동 가이드)

> **프로젝트**: 여행한입 (Trip Bite)
> **작성일**: 2026-03-11
> **버전**: 1.0

---

## 전체 API 요약

| # | API | 제공처 | 용도 | 비용 | 일일 제한 |
|---|-----|--------|------|------|----------|
| 1 | TourAPI 4.0 | 한국관광공사 (data.go.kr) | 여행지/맛집 데이터 | 무료 | 1,000~10,000회 |
| 2 | COOKRCP01 | 식품의약품안전처 (식품안전나라) | 레시피 데이터 | 무료 | 1,000회 |
| 3 | 기상청 단기예보 | 기상청 (data.go.kr) | 날씨 데이터 | 무료 | 10,000회 |
| 4 | 네이버 지도 API | Naver Cloud Platform | 지도 표시 | 상품 정책/플랜별 상이 | 콘솔 쿼터 확인 |
| 5 | 카카오 지도 API | Kakao Developers | 지도 보조/길찾기 | 상품 정책별 상이 | 콘솔/정책 문서 확인 |
| 6 | 고캠핑 API | 한국관광공사 (data.go.kr) | 캠핑장 데이터 | 무료 | 1,000~10,000회 |

---

## 1. TourAPI 4.0 (한국관광공사)

### 1.1 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 한국관광공사_국문 관광정보 서비스_GW |
| 제공처 | 한국관광공사 |
| 플랫폼 | 공공데이터포털 (data.go.kr) |
| 데이터 | 여행지, 문화시설, 축제, 음식점, 레포츠, 여행코스 |
| 프로토콜 | REST API (HTTP GET) |
| 응답 형식 | XML, JSON |

### 1.2 신청 방법

#### Step 1: 공공데이터포털 회원가입

1. https://www.data.go.kr 접속
2. 우측 상단 **[회원가입]** 클릭
3. 본인인증 진행 (휴대폰 또는 공동인증서)
4. 회원 정보 입력 후 가입 완료

#### Step 2: TourAPI 활용 신청

1. 로그인 후 상단 검색바에 **"국문 관광정보"** 검색
2. **"한국관광공사_국문 관광정보 서비스_GW"** 선택
3. **[활용신청]** 버튼 클릭
4. 활용 목적 입력:
   - 활용 목적: `여행/맛집 정보 통합 플랫폼 개발`
   - 상세 기능: `여행지/맛집 검색, 지역별 탐색, 접근성 정보 제공`
   - 시스템 유형: `웹 서비스`
5. 라이선스 동의 후 **[신청]**
6. **자동 승인** (대부분 즉시 발급)

#### Step 3: API 키 확인

1. 마이페이지 → **[활용 현황]**
2. 승인된 서비스 목록에서 해당 API 클릭
3. **일반 인증키 (Encoding/Decoding)** 확인
4. `.env.local`에 저장:
   ```
   TOUR_API_KEY=발급받은_디코딩_키
   ```

### 1.3 키 종류 및 제한

| 키 종류 | 일일 호출 | 발급 |
|---------|----------|------|
| 일반 인증키 | 1,000회/일 | 자동 (즉시) |
| 활용 인증키 | 10,000회/일 | 승인 (1~3일) |

> **권장**: 개발 초기에는 일반 인증키로 시작. 서비스 출시 전 활용 인증키 신청.
> 활용 인증키는 마이페이지 → 해당 API → **[트래픽 추가 신청]** 에서 요청.

### 1.4 테스트 방법

```bash
# 서울 관광지 목록 조회 테스트
curl "https://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey={YOUR_KEY}&MobileOS=ETC&MobileApp=TripBite&_type=json&areaCode=1&contentTypeId=12&numOfRows=5"
```

### 1.5 주의사항

- **인코딩 키 vs 디코딩 키**: URL에 직접 넣을 때는 인코딩 키, 코드에서 라이브러리가 자동 인코딩할 때는 디코딩 키 사용
- 일일 호출 횟수는 자정(00:00) 기준 초기화
- 30일 이상 미사용 시 키 비활성화 가능 (재활성화 가능)
- 응답 지연 시 타임아웃 10초 이상 설정 권장

---

## 2. COOKRCP01 레시피 API (식품의약품안전처)

### 2.1 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 조리식품의 레시피 DB |
| 제공처 | 식품의약품안전처 |
| 플랫폼 | 공공데이터포털 (data.go.kr) 또는 식품안전나라 |
| 데이터 | 레시피 (재료, 조리법, 영양정보, 이미지) |
| 프로토콜 | REST API (HTTP GET) |
| 응답 형식 | JSON, XML |

### 2.2 신청 방법

#### 방법 A: 공공데이터포털 경유 (권장)

1. https://www.data.go.kr 로그인
2. **"조리식품의 레시피"** 검색
3. **"식품의약품안전처_조리식품의 레시피 DB"** 선택
4. **[활용신청]** 클릭
5. 활용 목적 입력:
   - 활용 목적: `지역 특산품 연계 레시피 정보 제공`
   - 상세 기능: `레시피 검색, 조리법 표시, 영양정보 제공`
6. 신청 후 **자동 승인** (즉시)

#### 방법 B: 식품안전나라 직접 신청

1. https://www.foodsafetykorea.go.kr 접속
2. 상단 메뉴 **[공공데이터]** → **[Open API]**
3. **"조리식품의 레시피 DB"** 찾기
4. **[인증키 신청]** 클릭
5. 회원가입/로그인 후 목적 입력
6. **인증키 발급** (즉시 또는 1~2일)

#### API 키 저장

```
RECIPE_API_KEY=발급받은_인증키
```

### 2.3 키 제한

| 항목 | 내용 |
|------|------|
| 일일 호출 | 1,000회 (기본) |
| 한 번에 조회 | 최대 1,000건 (startIdx~endIdx) |
| 전체 레시피 수 | 약 1,000~1,200건 |

### 2.4 테스트 방법

```bash
# 레시피 1~5번 조회
curl "http://openapi.foodsafetykorea.go.kr/api/{YOUR_KEY}/COOKRCP01/json/1/5"

# 김치 관련 레시피 검색
curl "http://openapi.foodsafetykorea.go.kr/api/{YOUR_KEY}/COOKRCP01/json/1/10/RCP_NM=김치"
```

### 2.5 주의사항

- API URL이 **HTTP** (HTTPS 미지원 가능) → 서버 사이드에서만 호출
- 데이터가 한국어만 제공됨 → 영어 번역은 별도 처리 필요
- 이미지 URL이 HTTP일 수 있음 → next/image 설정에서 해당 도메인 허용 필요
- MANUAL01~MANUAL20 필드 중 빈 값도 있으므로 null 체크 필요

---

## 3. 기상청 단기예보 API

### 3.1 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 기상청_단기예보 ((구)동네예보) 조회서비스 |
| 제공처 | 기상청 |
| 플랫폼 | 공공데이터포털 (data.go.kr) |
| 데이터 | 기온, 하늘상태, 강수확률, 습도, 풍속 등 |
| 프로토콜 | REST API (HTTP GET) |
| 응답 형식 | JSON, XML |

### 3.2 신청 방법

#### Step 1: 공공데이터포털에서 신청

1. https://www.data.go.kr 로그인
2. **"단기예보"** 검색
3. **"기상청_단기예보 ((구)동네예보) 조회서비스"** 선택
4. **[활용신청]** 클릭
5. 활용 목적 입력:
   - 활용 목적: `지역 대표 날씨 정보 제공`
   - 상세 기능: `지역 대표 날씨 표시, 3일 예보, 계절별 여행지 추천`
6. **자동 승인** (즉시)

#### Step 2: API 키 저장

```
WEATHER_API_KEY=발급받은_디코딩_키
```

### 3.3 키 제한

| 항목 | 내용 |
|------|------|
| 일일 호출 | 10,000회 (일반 인증키) |
| 추가 신청 | 활용 인증키 (심사 후 확대) |

### 3.4 테스트 방법

```bash
# 서울 (nx=60, ny=127) 단기예보 조회
curl "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey={YOUR_KEY}&pageNo=1&numOfRows=100&dataType=JSON&base_date=20260311&base_time=0500&nx=60&ny=127"

# 서울 초단기예보 조회
curl "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey={YOUR_KEY}&pageNo=1&numOfRows=60&dataType=JSON&base_date=20260311&base_time=0630&nx=60&ny=127"
```

### 3.5 주의사항

- **base_time 규칙이 엄격함**:
  - 단기예보: 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300 (하루 8회)
  - 초단기예보: 매시 30분 (0030, 0130, ..., 2330)
  - 잘못된 base_time 입력 시 에러 반환
- **발표 시각 이후에만 조회 가능**: 0500 발표 데이터는 약 05:10 이후부터 조회 가능 (생성 지연)
- **격자좌표 (nx, ny)** 사용: 위경도(lat, lng)가 아님. 변환 필요
  - 기상청 격자좌표 변환 수식 또는 매핑 테이블 사용
  - `docs/04-api-integration.md`의 `AREA_GRID_COORDS` 참조
- 응답의 `category` 코드 해석 필요 (TMP, SKY, PTY 등)
- 한 번의 호출에 여러 시간대/카테고리 데이터가 한꺼번에 반환 → 파싱 로직 필요

### 3.6 base_time 선택 로직

```typescript
// 현재 시각 기준 가장 최근 발표 시각 계산
function getLatestBaseTime(): { baseDate: string; baseTime: string } {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // 단기예보 발표 시각 (약 10분 후 API 제공)
  const baseTimes = ['2300', '2000', '1700', '1400', '1100', '0800', '0500', '0200'];
  const baseHours = [23, 20, 17, 14, 11, 8, 5, 2];

  let baseTime = '2300';
  let baseDate = formatDate(now);

  for (let i = 0; i < baseHours.length; i++) {
    if (hours > baseHours[i] || (hours === baseHours[i] && minutes >= 10)) {
      baseTime = baseTimes[i];
      break;
    }
  }

  // 0200 이전이면 전날 2300 사용
  if (hours < 2 || (hours === 2 && minutes < 10)) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    baseDate = formatDate(yesterday);
    baseTime = '2300';
  }

  return { baseDate, baseTime };
}
```

---

## 4. 네이버 지도 API

### 4.1 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | Naver Maps JavaScript API v3 |
| 제공처 | Naver Cloud Platform |
| 용도 | 여행지/맛집 위치 지도 표시, 마커 |
| 프로토콜 | JavaScript SDK |
| 과금 | 상품 정책/플랜에 따라 상이 (콘솔 Usage/Statistics 기준 확인) |

### 4.2 신청 방법

#### Step 1: 네이버 클라우드 플랫폼 가입

1. https://www.ncloud.com 접속
2. 네이버 계정으로 로그인 (또는 신규 가입)
3. 결제 수단 등록 (무료 사용이라도 등록 필요)
   - 신용카드 또는 체크카드 등록
   - 무료 한도 내에서는 과금되지 않음

#### Step 2: 앱 등록

1. Naver Cloud 콘솔에서 **Maps 관련 Application 등록 메뉴**로 이동
2. 콘솔 메뉴명은 개편에 따라 달라질 수 있으므로 최신 가이드를 기준으로 확인
3. Application 이름: `TripBite`
4. **Service 선택**: **Maps** 체크 (Web Dynamic Map)
5. **서비스 환경 등록**:
   - Web 서비스 URL: `http://localhost:3000` (개발)
   - Web 서비스 URL: `https://tripbite.kr` (프로덕션)
   - Web 서비스 URL: `https://*.vercel.app` (Preview)
6. **[등록]** 클릭

#### Step 3: Client ID 확인

1. 등록된 앱 클릭 → **인증 정보** 탭
2. **Client ID** 복사
3. `.env.local`에 저장:
   ```
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_Client_ID
   ```

> `NEXT_PUBLIC_` prefix: 클라이언트(브라우저)에서 사용해야 하므로 public 변수로 설정

### 4.3 할당량/과금 확인

- 실제 무료 제공량과 과금 단가는 상품/플랜에 따라 변동될 수 있다.
- 배포 전 콘솔의 **Usage / Statistics / Quota** 화면에서 월간 예상 지도 로드 수를 확인한다.
- Preview 도메인까지 등록하면 QA 중 불필요한 인증 오류를 줄일 수 있다.

### 4.4 테스트 방법

```html
<!-- 테스트용 HTML -->
<!DOCTYPE html>
<html>
<head>
  <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID"></script>
</head>
<body>
  <div id="map" style="width:600px;height:400px;"></div>
  <script>
    var map = new naver.maps.Map('map', {
      center: new naver.maps.LatLng(37.5788, 126.9770), // 경복궁
      zoom: 15
    });
    new naver.maps.Marker({
      position: new naver.maps.LatLng(37.5788, 126.9770),
      map: map
    });
  </script>
</body>
</html>
```

### 4.5 주의사항

- **도메인 제한**: 등록한 도메인에서만 동작. localhost 개발 시 `http://localhost:3000` 등록 필수
- **HTTPS 권장**: 프로덕션에서는 HTTPS 도메인만 사용
- **서브도메인 와일드카드**: `*.vercel.app` 패턴 등록으로 Preview 배포 대응
- **스크립트 로딩**: Next.js에서 `next/script` 사용하여 로드
  ```tsx
  <Script
    src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
    strategy="afterInteractive"
  />
  ```
- **SSR 불가**: `window.naver`는 클라이언트에서만 사용 가능 → `'use client'` 컴포넌트에서만 사용

---

## 5. 카카오 지도 API

### 5.1 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | Kakao Maps SDK, 카카오 로컬 REST API |
| 제공처 | Kakao Developers |
| 용도 | 지도 폴백, 카카오맵 길찾기 연동, 주변 장소 검색 |
| 프로토콜 | JavaScript SDK + REST API |
| 과금 | 정책/쿼터 기준 확인 필요 |

### 5.2 신청 방법

#### Step 1: Kakao Developers 가입

1. https://developers.kakao.com 접속
2. 카카오 계정으로 로그인
3. 개발자 등록 (최초 1회)
   - 이름, 이메일, 전화번호 입력
   - 이용약관 동의

#### Step 2: 앱 만들기

1. **[내 애플리케이션]** → **[애플리케이션 추가하기]**
2. 앱 이름: `TripBite`
3. 사업자명: (개인 개발 시 본인 이름)
4. **[저장]** 클릭

#### Step 3: 키 확인 및 플랫폼 등록

1. 생성된 앱 클릭 → **앱 키** 탭
2. 필요한 키 확인:
   - **JavaScript 키**: 지도 SDK용 (클라이언트)
   - **REST API 키**: 로컬 API용 (서버)

3. **플랫폼** 탭 → **[Web 플랫폼 등록]**
   - 사이트 도메인: `http://localhost:3000`
   - 사이트 도메인: `https://tripbite.kr`
   - 사이트 도메인: `https://*.vercel.app`

4. `.env.local`에 저장:
   ```
   NEXT_PUBLIC_KAKAO_MAP_APP_KEY=발급받은_JavaScript_키
   KAKAO_REST_API_KEY=발급받은_REST_API_키
   ```

### 5.3 할당량/정책 확인

- Kakao Maps SDK와 Local API의 호출 한도는 정책 변경 가능성이 있으므로 최신 개발자 문서를 확인한다.
- MVP에서는 카카오를 주 지도 엔진이 아니라 길찾기/외부 링크/보조 검색 용도로 제한해 사용량을 낮춘다.

### 5.4 테스트 방법

```bash
# 카카오 로컬 API - 키워드 장소 검색 테스트
curl -H "Authorization: KakaoAK {REST_API_KEY}" \
  "https://dapi.kakao.com/v2/local/search/keyword.json?query=경복궁"

# 주변 음식점 검색 (경복궁 좌표 기준 1km)
curl -H "Authorization: KakaoAK {REST_API_KEY}" \
  "https://dapi.kakao.com/v2/local/search/keyword.json?query=맛집&x=126.9770&y=37.5788&radius=1000&category_group_code=FD6"
```

### 5.5 주의사항

- **JavaScript 키 vs REST API 키** 구분 필수
  - JavaScript 키: 브라우저에서 지도 SDK 로드용 (`NEXT_PUBLIC_`)
  - REST API 키: 서버에서 로컬 API 호출용 (절대 클라이언트 노출 금지)
- **플랫폼 등록 필수**: 미등록 도메인에서는 "앱 키가 유효하지 않습니다" 에러
- **할당량 모니터링**: 대시보드 → **[쿼터]** 에서 일별 사용량 확인
- **`place_url` 활용**: 로컬 API 응답의 `place_url`은 카카오맵 상세 링크 CTA에 사용 가능
- **외부 리뷰 수집 제외**: MVP 문서 기준으로 카카오 리뷰 원문을 내부 DB에 적재하지 않음

---

## 6. 고캠핑 API (한국관광공사)

### 6.1 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 한국관광공사_고캠핑 정보 조회 서비스 |
| 제공처 | 한국관광공사 |
| 플랫폼 | 공공데이터포털 (data.go.kr) |
| 데이터 | 캠핑장 위치, 시설, 부대시설, 반려동물, 사이트 유형, 운영기간 |
| 프로토콜 | REST API (HTTP GET) |
| 응답 형식 | JSON, XML |

### 6.2 신청 방법

#### Step 1: 공공데이터포털에서 신청

1. https://www.data.go.kr 로그인 (TourAPI 신청 시 이미 가입된 상태)
2. 상단 검색바에 **"고캠핑"** 검색
3. **"한국관광공사_고캠핑 정보 조회 서비스"** 선택
4. **[활용신청]** 클릭
5. 활용 목적 입력:
   - 활용 목적: `캠핑장 정보 통합 제공 플랫폼 개발`
   - 상세 기능: `캠핑장 검색, 시설 정보 조회, 위치 기반 캠핑장 탐색`
   - 시스템 유형: `웹 서비스`
6. 라이선스 동의 후 **[신청]**
7. **자동 승인** (대부분 즉시 발급)

#### Step 2: API 키 확인

1. 마이페이지 → **[활용 현황]**
2. 승인된 서비스 목록에서 해당 API 클릭
3. **일반 인증키 (Encoding/Decoding)** 확인
4. `.env.local`에 저장:
   ```
   CAMPING_API_KEY=발급받은_디코딩_키
   ```

### 6.3 키 종류 및 제한

| 키 종류 | 일일 호출 | 발급 |
|---------|----------|------|
| 일반 인증키 | 1,000회/일 | 자동 (즉시) |
| 활용 인증키 | 10,000회/일 | 승인 (1~3일) |

> **권장**: TourAPI와 마찬가지로 개발 초기에는 일반 인증키로 시작. 서비스 출시 전 활용 인증키 신청.

### 6.4 테스트 방법

```bash
# 캠핑장 목록 조회 (처음 5개)
curl "https://apis.data.go.kr/B551011/GoCamping/basedList?serviceKey={YOUR_KEY}&MobileOS=ETC&MobileApp=TripBite&_type=json&numOfRows=5&pageNo=1"

# 캠핑장 키워드 검색 (서울)
curl "https://apis.data.go.kr/B551011/GoCamping/searchList?serviceKey={YOUR_KEY}&MobileOS=ETC&MobileApp=TripBite&_type=json&keyword=%EC%84%9C%EC%9A%B8&numOfRows=5"

# 위치 기반 캠핑장 검색 (서울숲 기준 반경 10km)
curl "https://apis.data.go.kr/B551011/GoCamping/locationBasedList?serviceKey={YOUR_KEY}&MobileOS=ETC&MobileApp=TripBite&_type=json&mapX=127.0374&mapY=37.5445&radius=10000&numOfRows=5"

# 캠핑장 이미지 조회
curl "https://apis.data.go.kr/B551011/GoCamping/imageList?serviceKey={YOUR_KEY}&MobileOS=ETC&MobileApp=TripBite&_type=json&contentId=100001"
```

### 6.5 주의사항

- TourAPI와 동일한 공공데이터포털 인증 방식 (serviceKey)
- **인코딩 키 vs 디코딩 키**: TourAPI와 동일 규칙 적용
- 일일 호출 횟수는 자정(00:00) 기준 초기화
- 캠핑장 데이터는 한국어만 제공 → 영어 번역 별도 처리 필요
- 일부 캠핑장의 이미지 URL이 HTTP일 수 있음 → `next.config.ts`에서 `gocamping.or.kr` 도메인 허용 필요
- `sbrsCl`(부대시설), `posblFcltyCl`(주변시설) 등은 콤마 구분 문자열 → 파싱 필요

---

## 7. 환경 변수 종합 (.env.local)

```bash
# ============================================
# Supabase
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # 공개 키 (브라우저 OK)
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # 비밀 키 (서버만)

# ============================================
# TourAPI 4.0 (한국관광공사)
# 신청: data.go.kr → "국문 관광정보" 검색 → 활용신청
# ============================================
TOUR_API_KEY=디코딩_키_입력

# ============================================
# COOKRCP01 레시피 API (식약처)
# 신청: data.go.kr → "조리식품의 레시피" 검색 → 활용신청
# ============================================
RECIPE_API_KEY=인증키_입력

# ============================================
# 기상청 단기예보 API
# 신청: data.go.kr → "단기예보" 검색 → 활용신청
# ============================================
WEATHER_API_KEY=디코딩_키_입력

# ============================================
# 고캠핑 API (한국관광공사)
# 신청: data.go.kr → "고캠핑" 검색 → 활용신청
# ============================================
CAMPING_API_KEY=디코딩_키_입력

# ============================================
# 네이버 지도 API
# 신청: ncloud.com 콘솔에서 Maps Application 등록
# ============================================
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=클라이언트_ID_입력

# ============================================
# 카카오 지도/로컬 API
# 신청: developers.kakao.com → 앱 만들기
# ============================================
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=JavaScript_키_입력
KAKAO_REST_API_KEY=REST_API_키_입력
```

### 변수 접근 범위 정리

| 변수 | `NEXT_PUBLIC_` | 접근 범위 | 이유 |
|------|---------------|----------|------|
| NEXT_PUBLIC_SUPABASE_URL | O | Server + Client | Supabase JS 클라이언트 초기화 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | O | Server + Client | RLS로 보호되는 공개 키 |
| SUPABASE_SERVICE_ROLE_KEY | X | **Server only** | RLS 우회 가능한 비밀 키 |
| TOUR_API_KEY | X | **Server only** | API 프록시에서만 사용 |
| RECIPE_API_KEY | X | **Server only** | API 프록시에서만 사용 |
| WEATHER_API_KEY | X | **Server only** | API 프록시에서만 사용 |
| CAMPING_API_KEY | X | **Server only** | API 프록시에서만 사용 |
| NAVER_MAP_CLIENT_ID | O | Client | 브라우저에서 지도 스크립트 로드 |
| KAKAO_MAP_APP_KEY | O | Client | 브라우저에서 지도 SDK 로드 |
| KAKAO_REST_API_KEY | X | **Server only** | 로컬 API 서버 호출용 |

---

## 8. API 키 발급 체크리스트

### Phase 0 (프로젝트 셋업)
- [ ] Supabase 프로젝트 생성 → URL, Anon Key, Service Role Key

### Phase 1 (여행지/맛집)
- [ ] data.go.kr 회원가입
- [ ] TourAPI 4.0 활용 신청 → API Key
- [ ] Naver Cloud Platform 가입 → Application 등록 → Client ID
- [ ] Kakao Developers 가입 → 앱 만들기 → JavaScript Key, REST API Key

### Phase 2 (레시피)
- [ ] COOKRCP01 활용 신청 → API Key (data.go.kr에서 추가 신청)

### Phase 4 (날씨)
- [ ] 기상청 단기예보 활용 신청 → API Key (data.go.kr에서 추가 신청)
- [ ] 고캠핑 API 활용 신청 → API Key (data.go.kr에서 추가 신청)

### 프로덕션 배포 전
- [ ] TourAPI 활용 인증키 (10,000회/일) 업그레이드 신청
- [ ] 고캠핑 API 활용 인증키 (10,000회/일) 업그레이드 신청
- [ ] 모든 API 키 Vercel 환경 변수에 등록
- [ ] 네이버 지도 프로덕션 도메인 등록
- [ ] 카카오 지도 프로덕션 도메인 등록

---

## 9. 트러블슈팅

### 공통

| 문제 | 원인 | 해결 |
|------|------|------|
| `SERVICE_KEY_IS_NOT_REGISTERED_ERROR` | API 키 미승인 또는 오타 | 마이페이지에서 키 상태 확인, 디코딩 키 사용 여부 확인 |
| `LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR` | 일일 호출 제한 초과 | 캐시 전략 강화, 활용 인증키 업그레이드 |
| 응답 없음 / 타임아웃 | 공공 API 서버 불안정 | 재시도 로직, Supabase 캐시 폴백 |

### TourAPI

| 문제 | 원인 | 해결 |
|------|------|------|
| 빈 items 반환 | areaCode나 contentTypeId 잘못된 값 | `docs/04-api-integration.md`의 코드 매핑 확인 |
| 이미지 URL 깨짐 | HTTP URL, CDN 변경 | `next.config.ts`에 이미지 도메인 추가 |
| XML 응답 | `_type=json` 누락 | 모든 요청에 `_type=json` 파라미터 추가 |

### 기상청 API

| 문제 | 원인 | 해결 |
|------|------|------|
| `NO_DATA` 에러 | base_time이 아직 발표되지 않은 시간 | 발표 후 10분 지연 고려, 이전 발표 시각 사용 |
| 잘못된 날씨 데이터 | nx, ny 좌표 오류 | `AREA_GRID_COORDS` 매핑 검증 |
| 대량의 item 반환 | numOfRows 미설정 | `numOfRows=1000` 설정하여 전체 데이터 한 번에 수신 |

### 고캠핑 API

| 문제 | 원인 | 해결 |
|------|------|------|
| 빈 items 반환 | 키워드 인코딩 문제 | URL 인코딩 확인, 디코딩 키 사용 여부 확인 |
| 이미지 URL 깨짐 | HTTP URL, CDN 변경 | `next.config.ts`에 `gocamping.or.kr` 이미지 도메인 추가 |
| 위치 기반 검색 결과 없음 | 좌표 순서 오류 (mapX=경도, mapY=위도) | X가 경도, Y가 위도임에 주의 |
| `sbrsCl` 파싱 오류 | 빈 문자열 또는 null | null/빈 문자열 체크 후 split 처리 |

### 네이버 지도

| 문제 | 원인 | 해결 |
|------|------|------|
| `Authentication failed` | Client ID 오류 또는 도메인 미등록 | 앱 설정 → Web 서비스 URL 확인 |
| `naver is not defined` | 스크립트 미로드 상태에서 접근 | Script onLoad 또는 useEffect에서 `window.naver` 체크 |

### 카카오 API

| 문제 | 원인 | 해결 |
|------|------|------|
| `KOE004` (앱 키 없음) | REST API 키로 JS SDK 사용 또는 반대 | 키 종류 확인 (JavaScript vs REST API) |
| `KOE101` (권한 없음) | 플랫폼 미등록 | 앱 설정 → 플랫폼 → Web 도메인 등록 |
| 외부 리뷰 링크만 보이고 리뷰 데이터 없음 | Local API는 장소 검색/상세 링크 중심 | `place_url` 기반 외부 이동 CTA만 제공 |
