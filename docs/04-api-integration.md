# 04-API Integration

> **프로젝트**: 여행한입 (Trip Bite)
> **작성일**: 2026-03-11
> **버전**: 1.0

---

## 1. TourAPI 4.0

### 1.1 개요

| 항목 | 내용 |
|------|------|
| 제공처 | 한국관광공사 (data.go.kr) |
| Base URL | `https://apis.data.go.kr/B551011/KorService1` |
| 인증 | API Key (Query Parameter: `serviceKey`) |
| 응답 형식 | JSON (`_type=json`) |
| 호출 제한 | 일반 키: 1,000회/일, 활용 키: 10,000회/일 |
| 구현 파일 | `src/lib/api/tour-api.ts` |

### 1.2 공통 파라미터

| 파라미터 | 필수 | 기본값 | 설명 |
|---------|------|--------|------|
| serviceKey | O | - | 인증 키 (URL encoding) |
| MobileOS | O | `ETC` | 운영체제 |
| MobileApp | O | `TripBite` | 앱 이름 |
| _type | O | `json` | 응답 형식 |
| numOfRows | X | `10` | 한 페이지 결과 수 |
| pageNo | X | `1` | 페이지 번호 |

### 1.3 엔드포인트별 명세

#### 1.3.1 areaBasedList1 - 지역기반 관광정보 조회

```
GET /areaBasedList1
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| contentTypeId | X | 관광타입 (12,14,15,25,28,39) |
| areaCode | X | 지역코드 |
| sigunguCode | X | 시군구코드 |
| arrange | X | 정렬 (A:제목순, C:수정일순, D:생성일순, O:대표이미지순, Q:거리순, R:인기순) |
| listYN | X | 목록구분 (Y:목록, N:개수) |

**응답 예시:**
```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": {
        "item": [
          {
            "contentid": "126508",
            "contenttypeid": "12",
            "title": "경복궁",
            "addr1": "서울특별시 종로구 사직로 161",
            "addr2": "",
            "areacode": "1",
            "sigungucode": "23",
            "firstimage": "http://tong.visitkorea.or.kr/cms/resource/...",
            "mapx": "126.9769930325",
            "mapy": "37.5788222356",
            "tel": "02-3700-3900"
          }
        ]
      },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 1234
    }
  }
}
```

#### 1.3.2 searchKeyword1 - 키워드 검색

```
GET /searchKeyword1
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| keyword | O | 검색어 (URL encoding) |
| contentTypeId | X | 관광타입 필터 |
| areaCode | X | 지역 필터 |
| arrange | X | 정렬 |

#### 1.3.3 detailCommon1 - 공통 정보 조회

```
GET /detailCommon1
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| contentId | O | 콘텐츠 ID |
| defaultYN | X | 기본 정보 (Y/N) |
| firstImageYN | X | 대표 이미지 (Y/N) |
| addrinfoYN | X | 주소 정보 (Y/N) |
| mapinfoYN | X | 좌표 정보 (Y/N) |
| overviewYN | X | 개요 (Y/N) |

#### 1.3.4 detailIntro1 - 소개 정보 조회

```
GET /detailIntro1
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| contentId | O | 콘텐츠 ID |
| contentTypeId | O | 관광타입 |

**contentTypeId별 반환 필드:**
- 12 (관광지): `accomcount`, `usetime`, `restdate`, `infocenter`, `parking`
- 14 (문화시설): `usefee`, `usetimeculture`, `restdateculture`, `infocenterculture`
- 39 (음식점): `firstmenu`, `opentimefood`, `restdatefood`, `packing`, `treatmenu`

#### 1.3.5 detailImage1 - 이미지 정보 조회

```
GET /detailImage1
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| contentId | O | 콘텐츠 ID |
| imageYN | X | 이미지 조회 (Y) |
| subImageYN | X | 서브 이미지 조회 (Y) |

#### 1.3.6 detailPetTour1 - 반려동물 동반 정보

```
GET /detailPetTour1
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| contentId | O | 콘텐츠 ID |
| contentTypeId | O | 관광타입 |

**반환 필드:** `acmpyTypeCd`, `relaPosesFclty`, `acmpyPsblCpam`, `relaAcdntRiskMtr`, `acmpyNeedMtr`

#### 1.3.7 detailWithTour1 - 무장애 관광 정보

```
GET /detailWithTour1
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| contentId | O | 콘텐츠 ID |
| contentTypeId | O | 관광타입 |

**반환 필드:** `wheelchair`, `exit`, `elevator`, `restroom`, `braileblock`, `helpdog`, `guidesystem`, `parking`

#### 1.3.8 areaCode1 - 지역코드 조회

```
GET /areaCode1
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| areaCode | X | 지역코드 (생략 시 전체 시도) |

### 1.4 Content Type ID 매핑

| ID | 타입 | 한국어 | 영어 |
|----|------|--------|------|
| 12 | 관광지 | 관광지 | Tourist Attraction |
| 14 | 문화시설 | 문화시설 | Cultural Facility |
| 15 | 축제/공연/행사 | 축제 | Festival/Event |
| 25 | 여행코스 | 여행코스 | Travel Course |
| 28 | 레포츠 | 레포츠 | Leisure/Sports |
| 39 | 음식점 | 음식점 | Restaurant |

### 1.5 TourAPI 클라이언트 설계

```typescript
// src/lib/api/tour-api.ts

class TourApiClient {
  private baseUrl = 'https://apis.data.go.kr/B551011/KorService1';
  private serviceKey: string;

  // 지역 기반 목록
  async getAreaBasedList(params: {
    areaCode?: number;
    sigunguCode?: number;
    contentTypeId?: number;
    arrange?: 'A' | 'C' | 'D' | 'O' | 'Q' | 'R';
    numOfRows?: number;
    pageNo?: number;
  }): Promise<TourApiListResponse>

  // 키워드 검색
  async searchKeyword(params: {
    keyword: string;
    contentTypeId?: number;
    areaCode?: number;
    numOfRows?: number;
    pageNo?: number;
  }): Promise<TourApiListResponse>

  // 공통 상세
  async getDetailCommon(contentId: string): Promise<TourApiDetailResponse>

  // 타입별 소개
  async getDetailIntro(contentId: string, contentTypeId: number): Promise<TourApiIntroResponse>

  // 이미지 목록
  async getDetailImages(contentId: string): Promise<TourApiImageResponse>

  // 반려동물 동반 정보
  async getPetTourDetail(contentId: string, contentTypeId: number): Promise<TourApiPetResponse>

  // 무장애 관광 정보
  async getWithTourDetail(contentId: string, contentTypeId: number): Promise<TourApiWithResponse>

  // 지역 코드
  async getAreaCodes(areaCode?: number): Promise<TourApiAreaResponse>
}
```

---

## 2. COOKRCP01 레시피 API

### 2.1 개요

| 항목 | 내용 |
|------|------|
| 제공처 | 식품의약품안전처 (식품안전나라) |
| Base URL | `http://openapi.foodsafetykorea.go.kr/api/{KEY}/COOKRCP01/json/{start}/{end}` |
| 인증 | API Key (URL Path) |
| 응답 형식 | JSON |
| 구현 파일 | `src/lib/api/recipe-api.ts` |

### 2.2 요청 형식

```
GET http://openapi.foodsafetykorea.go.kr/api/{API_KEY}/COOKRCP01/json/{startIdx}/{endIdx}
```

| 경로 파라미터 | 설명 |
|-------------|------|
| API_KEY | 발급받은 인증키 |
| startIdx | 시작 인덱스 (1부터) |
| endIdx | 종료 인덱스 |

### 2.3 필터 파라미터

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| RCP_NM | 메뉴명 검색 | `RCP_NM=김치찌개` |
| RCP_PARTS_DTLS | 재료 검색 | `RCP_PARTS_DTLS=돼지고기` |
| RCP_PAT2 | 요리종류 | `RCP_PAT2=밥` (밥, 반찬, 국, 찌개, 디저트 등) |
| HASH_TAG | 해시태그 | `HASH_TAG=다이어트` |

### 2.4 응답 형식

```json
{
  "COOKRCP01": {
    "total_count": "1000",
    "row": [
      {
        "RCP_SEQ": "1",
        "RCP_NM": "육개장",
        "RCP_WAY2": "끓이기",
        "RCP_PAT2": "국&찌개",
        "INFO_WGT": "1인분",
        "INFO_ENG": "431",
        "INFO_CAR": "14.6",
        "INFO_PRO": "41.4",
        "INFO_FAT": "22.8",
        "INFO_NA": "1336.6",
        "HASH_TAG": "건강,단백질",
        "ATT_FILE_NO_MAIN": "http://...",
        "ATT_FILE_NO_MK": "http://...",
        "RCP_PARTS_DTLS": "소고기 양지 200g, 대파 2대, ...",
        "MANUAL01": "1. 소고기를 삶아 식힌다.",
        "MANUAL_IMG01": "http://...",
        "MANUAL02": "2. 대파, 숙주를 넣고 끓인다.",
        "MANUAL_IMG02": "http://...",
        // MANUAL03 ~ MANUAL20
        "RCP_NA_TIP": "나트륨을 줄이려면 간을 싱겁게"
      }
    ],
    "RESULT": {
      "MSG": "정상 처리되었습니다.",
      "CODE": "INFO-000"
    }
  }
}
```

### 2.5 데이터 매핑

| API 필드 | DB 컬럼 (recipes) | 변환 |
|---------|-------------------|------|
| RCP_SEQ | external_id | 문자열 |
| RCP_NM | title_ko | 직접 매핑 |
| RCP_PARTS_DTLS | ingredients_ko | 파싱 (콤마 분리) |
| MANUAL01~20 | steps[].description_ko | 배열 변환 |
| MANUAL_IMG01~20 | steps[].image_url | 배열 변환 |
| INFO_ENG | calorie | 숫자 변환 (kcal) |
| INFO_CAR, INFO_PRO, INFO_FAT, INFO_NA | nutrition | JSONB |
| ATT_FILE_NO_MAIN | main_image | 직접 매핑 |

### 2.6 레시피 API 클라이언트 설계

```typescript
// src/lib/api/recipe-api.ts

class RecipeApiClient {
  private baseUrl = 'http://openapi.foodsafetykorea.go.kr/api';
  private apiKey: string;

  // 레시피 목록 조회
  async getRecipes(params: {
    start: number;
    end: number;
    name?: string;
    ingredients?: string;
    type?: string;
  }): Promise<RecipeApiResponse>

  // 레시피 단건 조회 (RCP_SEQ로)
  async getRecipeById(seq: string): Promise<RecipeItem | null>

  // 전체 레시피 수 조회
  async getTotalCount(): Promise<number>

  // 원본 데이터 → DB 형식 변환
  static transformToDbFormat(item: RecipeApiItem): Partial<Recipe>
}
```

---

## 3. 네이버 지도 API

### 3.1 개요

| 항목 | 내용 |
|------|------|
| 제공처 | Naver Cloud Platform |
| 서비스 | Maps (JavaScript API v3) |
| 인증 | Client ID (헤더 또는 스크립트 파라미터) |
| 구현 파일 | `src/lib/api/map-api.ts`, `src/components/maps/NaverMap.tsx` |

### 3.2 JavaScript API v3

**스크립트 로드:**
```html
<script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId={CLIENT_ID}"></script>
```

**주요 클래스:**
| 클래스 | 용도 |
|--------|------|
| `naver.maps.Map` | 지도 인스턴스 생성 |
| `naver.maps.Marker` | 마커 표시 |
| `naver.maps.InfoWindow` | 정보 팝업 |
| `naver.maps.LatLng` | 좌표 객체 |
| `naver.maps.LatLngBounds` | 영역 객체 |

**기본 사용 패턴:**
```typescript
// NaverMap.tsx (Client Component)
'use client';

import { useEffect, useRef } from 'react';

interface NaverMapProps {
  latitude: number;
  longitude: number;
  markers?: Array<{
    lat: number;
    lng: number;
    title: string;
    content?: string;
  }>;
  zoom?: number;
}

export function NaverMap({ latitude, longitude, markers, zoom = 15 }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(latitude, longitude),
      zoom,
    });

    markers?.forEach(({ lat, lng, title, content }) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lng),
        map,
        title,
      });

      if (content) {
        const infoWindow = new naver.maps.InfoWindow({ content });
        naver.maps.Event.addListener(marker, 'click', () => {
          infoWindow.open(map, marker);
        });
      }
    });
  }, [latitude, longitude, markers, zoom]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}
```

### 3.3 네이버 검색 API (선택 - 장소 검색/외부 링크 보조)

| 항목 | 내용 |
|------|------|
| Base URL | `https://openapi.naver.com/v1/search/local.json` |
| 인증 | `X-Naver-Client-Id`, `X-Naver-Client-Secret` 헤더 |
| 용도 | 장소 검색 보조, 네이버 플레이스 상세 링크 후보 수집 |

> 참고: 이 API는 MVP 기준 외부 리뷰 원문 적재용이 아니라, 장소 매칭과 외부 상세 링크 CTA 구성 보조용으로만 사용한다.

---

## 4. 카카오 지도 API (보조)

### 4.1 개요

| 항목 | 내용 |
|------|------|
| 제공처 | Kakao Developers |
| 서비스 | Maps JavaScript SDK, 로컬 REST API |
| 인증 | JavaScript Key (Maps), REST API Key (로컬) |
| 용도 | 네이버 지도 폴백, 카카오맵 길찾기 연동 |

### 4.2 카카오 로컬 API

```
GET https://dapi.kakao.com/v2/local/search/keyword.json
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| query | O | 검색어 |
| x | X | 경도 (중심 좌표) |
| y | X | 위도 (중심 좌표) |
| radius | X | 반경 (미터, 최대 20000) |
| category_group_code | X | FD6(음식점), CE7(카페), AT4(관광명소) 등 |
| page | X | 페이지 (1~45) |
| size | X | 한 페이지 크기 (1~15) |

**인증 헤더:**
```
Authorization: KakaoAK {REST_API_KEY}
```

**주요 응답 필드:**
| 필드 | 설명 |
|------|------|
| `place_name` | 장소명 |
| `address_name` | 지번 주소 |
| `road_address_name` | 도로명 주소 |
| `x`, `y` | 경도, 위도 |
| `place_url` | 카카오맵 상세 페이지 URL |

### 4.3 카카오맵 길찾기 연동

```typescript
// 카카오맵 길찾기 URL 생성
function getKakaoDirectionUrl(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}
```

---

## 5. 기상청 단기예보 API

### 5.1 개요

| 항목 | 내용 |
|------|------|
| 제공처 | 기상청 (data.go.kr) |
| Base URL | `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0` |
| 인증 | API Key (Query Parameter) |
| 응답 형식 | JSON |
| 구현 파일 | `src/lib/api/weather-api.ts` |

### 5.2 초단기예보 조회

```
GET /getUltraSrtFcst
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| serviceKey | O | 인증키 |
| base_date | O | 발표일자 (YYYYMMDD) |
| base_time | O | 발표시각 (HHmm, 매시 30분 발표) |
| nx | O | 예보지점 X 좌표 |
| ny | O | 예보지점 Y 좌표 |
| numOfRows | X | 한 페이지 결과 수 |
| pageNo | X | 페이지 번호 |

### 5.3 단기예보 조회

```
GET /getVilageFcst
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| serviceKey | O | 인증키 |
| base_date | O | 발표일자 (YYYYMMDD) |
| base_time | O | 발표시각 (0200,0500,0800,1100,1400,1700,2000,2300) |
| nx | O | 예보지점 X 좌표 |
| ny | O | 예보지점 Y 좌표 |

### 5.4 예보 카테고리 코드

| 코드 | 설명 | 단위 |
|------|------|------|
| TMP | 1시간 기온 | ℃ |
| TMN | 일 최저기온 | ℃ |
| TMX | 일 최고기온 | ℃ |
| SKY | 하늘상태 | 1:맑음, 3:구름많음, 4:흐림 |
| PTY | 강수형태 | 0:없음, 1:비, 2:비/눈, 3:눈, 4:소나기 |
| PCP | 1시간 강수량 | mm |
| REH | 습도 | % |
| WSD | 풍속 | m/s |
| POP | 강수확률 | % |

### 5.5 지역코드 → 격자좌표 매핑

```typescript
// src/lib/constants/grid-coords.ts

// TourAPI area_code → 기상청 격자좌표(nx, ny) 매핑
export const AREA_GRID_COORDS: Record<number, { nx: number; ny: number }> = {
  1:  { nx: 60, ny: 127 },  // 서울
  2:  { nx: 69, ny: 107 },  // 인천
  3:  { nx: 67, ny: 100 },  // 대전
  4:  { nx: 89, ny: 90 },   // 대구
  5:  { nx: 58, ny: 74 },   // 광주
  6:  { nx: 98, ny: 76 },   // 부산
  7:  { nx: 102, ny: 84 },  // 울산
  8:  { nx: 66, ny: 103 },  // 세종
  31: { nx: 60, ny: 120 },  // 경기 (수원)
  32: { nx: 73, ny: 134 },  // 강원 (춘천)
  33: { nx: 69, ny: 107 },  // 충북 (청주)
  34: { nx: 68, ny: 100 },  // 충남 (홍성)
  35: { nx: 89, ny: 91 },   // 경북 (안동)
  36: { nx: 91, ny: 77 },   // 경남 (창원)
  37: { nx: 63, ny: 89 },   // 전북 (전주)
  38: { nx: 51, ny: 67 },   // 전남 (무안)
  39: { nx: 52, ny: 38 },   // 제주
};
```

### 5.6 응답 예시

```json
{
  "response": {
    "header": { "resultCode": "00", "resultMsg": "NORMAL_SERVICE" },
    "body": {
      "items": {
        "item": [
          {
            "baseDate": "20260311",
            "baseTime": "0500",
            "category": "TMP",
            "fcstDate": "20260311",
            "fcstTime": "0600",
            "fcstValue": "5",
            "nx": 60,
            "ny": 127
          }
        ]
      }
    }
  }
}
```

### 5.7 날씨 API 클라이언트 설계

```typescript
// src/lib/api/weather-api.ts

class WeatherApiClient {
  private baseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
  private apiKey: string;

  // 초단기예보 조회
  async getUltraShortForecast(params: {
    nx: number;
    ny: number;
    baseDate?: string;  // YYYYMMDD, 기본값: 오늘
    baseTime?: string;  // HHmm, 기본값: 최근 발표시각
  }): Promise<WeatherForecast[]>

  // 단기예보 조회 (3일)
  async getShortForecast(params: {
    nx: number;
    ny: number;
    baseDate?: string;
    baseTime?: string;
  }): Promise<WeatherForecast[]>

  // 지역 코드로 지역 대표 날씨 조회 (격자좌표 자동 변환)
  async getWeatherByAreaCode(areaCode: number): Promise<{
    current: CurrentWeather;
    forecast: DailyForecast[];
  }>

  // 원본 데이터 → DB 형식 변환
  static transformToWeatherCache(
    items: WeatherApiItem[],
    areaCode: number
  ): Partial<WeatherCache>[]
}
```

---

## 6. 고캠핑 API (GoCamping)

### 6.1 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 한국관광공사_고캠핑 정보 조회 서비스 |
| 제공처 | 한국관광공사 (data.go.kr) |
| Base URL | `https://apis.data.go.kr/B551011/GoCamping` |
| 인증 | API Key (Query Parameter: `serviceKey`) |
| 응답 형식 | JSON (`_type=json`) |
| 호출 제한 | 일반 키: 1,000회/일, 활용 키: 10,000회/일 |
| 구현 파일 | `src/lib/api/camping-api.ts` |

### 6.2 공통 파라미터

| 파라미터 | 필수 | 기본값 | 설명 |
|---------|------|--------|------|
| serviceKey | O | - | 인증 키 (URL encoding) |
| MobileOS | O | `ETC` | 운영체제 |
| MobileApp | O | `TripBite` | 앱 이름 |
| _type | O | `json` | 응답 형식 |
| numOfRows | X | `10` | 한 페이지 결과 수 |
| pageNo | X | `1` | 페이지 번호 |

### 6.3 엔드포인트별 명세

#### 6.3.1 basedList - 캠핑장 목록 조회

```
GET /basedList
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| numOfRows | X | 한 페이지 결과 수 |
| pageNo | X | 페이지 번호 |

전체 캠핑장 목록을 반환한다. 페이지네이션으로 전체 데이터를 조회할 수 있다.

#### 6.3.2 searchList - 캠핑장 키워드 검색

```
GET /searchList
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| keyword | O | 검색어 (URL encoding) |
| numOfRows | X | 한 페이지 결과 수 |
| pageNo | X | 페이지 번호 |

#### 6.3.3 locationBasedList - 위치 기반 캠핑장 조회

```
GET /locationBasedList
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| mapX | O | 경도 (longitude) |
| mapY | O | 위도 (latitude) |
| radius | X | 검색 반경 (m, 기본 20000) |
| numOfRows | X | 한 페이지 결과 수 |
| pageNo | X | 페이지 번호 |

#### 6.3.4 imageList - 캠핑장 이미지 조회

```
GET /imageList
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| contentId | O | 캠핑장 콘텐츠 ID |

### 6.4 주요 응답 필드

| API 필드 | 설명 | DB 매핑 |
|---------|------|---------|
| facltNm | 캠핑장 이름 | name_ko |
| addr1 / addr2 | 주소 | address_ko |
| mapX / mapY | 경도 / 위도 | longitude / latitude |
| tel | 전화번호 | tel |
| homepage | 홈페이지 | homepage |
| induty | 업종 (일반야영장,자동차야영장,카라반,글램핑) | induty |
| sbrsCl | 부대시설 (쉼터,놀이터,산책로 등) | facilities |
| posblFcltyCl | 주변시설 (계곡,해수욕장,낚시 등) | nearby_facilities |
| gnrlSiteCo | 일반 사이트 수 | site_counts.general |
| autoSiteCo | 자동차 사이트 수 | site_counts.auto |
| glampSiteCo | 글램핑 사이트 수 | site_counts.glamping |
| caravSiteCo | 카라반 사이트 수 | site_counts.caravan |
| indvdlCaravSiteCo | 개인 카라반 사이트 수 | site_counts.individual_caravan |
| animalCmgCl | 반려동물 동반 (가능/불가능/소형견) | animal_allowed |
| trlerAcmpnyAt | 트레일러 동반 가능 | trailer_allowed |
| caravAcmpnyAt | 카라반 동반 가능 | caravan_allowed |
| operPdCl | 운영기간 (봄,여름,가을,겨울) | operation_season |
| operDeCl | 운영일 | operation_days |
| hvofBgnde / hvofEndde | 휴장기간 시작/종료 | off_start / off_end |
| siteBottomCl1 | 잔디 사이트 수 | site_bottom_types.grass |
| siteBottomCl2 | 파쇄석 사이트 수 | site_bottom_types.crushed_stone |
| siteBottomCl3 | 데크 사이트 수 | site_bottom_types.deck |
| siteBottomCl4 | 자갈 사이트 수 | site_bottom_types.gravel |
| siteBottomCl5 | 맨흙 사이트 수 | site_bottom_types.dirt |
| brazierCl | 화로대 (개별/불가) | brazier_type |
| firstImageUrl | 대표 이미지 | first_image |
| createdtime | 등록일 | created_at |
| modifiedtime | 수정일 | updated_at |

### 6.5 응답 예시

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": {
        "item": [
          {
            "contentId": "100001",
            "facltNm": "서울숲 캠핑장",
            "addr1": "서울특별시 성동구 뚝섬로 273",
            "addr2": "",
            "mapX": "127.0374",
            "mapY": "37.5445",
            "tel": "02-460-2905",
            "homepage": "https://seoulforest.or.kr",
            "induty": "일반야영장",
            "sbrsCl": "전기,무선인터넷,장작판매,온수",
            "posblFcltyCl": "산책로,놀이터",
            "gnrlSiteCo": "30",
            "autoSiteCo": "0",
            "glampSiteCo": "5",
            "caravSiteCo": "0",
            "indvdlCaravSiteCo": "0",
            "animalCmgCl": "소형견",
            "trlerAcmpnyAt": "N",
            "caravAcmpnyAt": "N",
            "operPdCl": "봄,여름,가을",
            "operDeCl": "평일+주말",
            "hvofBgnde": "20261201",
            "hvofEndde": "20270228",
            "siteBottomCl1": "20",
            "siteBottomCl2": "0",
            "siteBottomCl3": "10",
            "siteBottomCl4": "0",
            "siteBottomCl5": "0",
            "brazierCl": "개별",
            "firstImageUrl": "https://gocamping.or.kr/upload/...",
            "createdtime": "2026-01-15 10:30:00",
            "modifiedtime": "2026-03-01 14:20:00"
          }
        ]
      },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 3500
    }
  }
}
```

### 6.6 CampingApiClient 설계

```typescript
// src/lib/api/camping-api.ts

class CampingApiClient {
  private baseUrl = 'https://apis.data.go.kr/B551011/GoCamping';
  private serviceKey: string;

  // 캠핑장 목록 조회
  async getBasedList(params: {
    numOfRows?: number;
    pageNo?: number;
  }): Promise<CampingApiListResponse>

  // 키워드 검색
  async searchList(params: {
    keyword: string;
    numOfRows?: number;
    pageNo?: number;
  }): Promise<CampingApiListResponse>

  // 위치 기반 검색
  async getLocationBasedList(params: {
    mapX: number;   // 경도
    mapY: number;   // 위도
    radius?: number; // 반경 (m)
    numOfRows?: number;
    pageNo?: number;
  }): Promise<CampingApiListResponse>

  // 이미지 목록 조회
  async getImageList(contentId: string): Promise<CampingApiImageResponse>

  // 원본 데이터 → DB 형식 변환
  static transformToDbFormat(item: CampingApiItem): Partial<CampingSite>
}
```

### 6.7 데이터 매핑 변환 로직

```typescript
// 부대시설 문자열 → 배열 변환
// "전기,무선인터넷,장작판매" → ["전기", "무선인터넷", "장작판매"]
function parseFacilities(sbrsCl: string): string[] {
  return sbrsCl ? sbrsCl.split(',').map(s => s.trim()) : [];
}

// 사이트 수 매핑
function parseSiteCounts(item: CampingApiItem): SiteCounts {
  return {
    general: parseInt(item.gnrlSiteCo) || 0,
    auto: parseInt(item.autoSiteCo) || 0,
    glamping: parseInt(item.glampSiteCo) || 0,
    caravan: parseInt(item.caravSiteCo) || 0,
    individual_caravan: parseInt(item.indvdlCaravSiteCo) || 0,
  };
}

// 바닥 타입별 사이트 수
function parseSiteBottomTypes(item: CampingApiItem): SiteBottomTypes {
  return {
    grass: parseInt(item.siteBottomCl1) || 0,
    crushed_stone: parseInt(item.siteBottomCl2) || 0,
    deck: parseInt(item.siteBottomCl3) || 0,
    gravel: parseInt(item.siteBottomCl4) || 0,
    dirt: parseInt(item.siteBottomCl5) || 0,
  };
}
```

---

## 7. 리뷰/평점 전략

### 7.1 Phase 1 (MVP): 자체 리뷰 시스템

```
사용자 (Supabase Auth) → reviews 테이블 → destinations / camping_sites 평균 평점 자동 갱신
```

- Supabase Auth 기반 사용자 인증 (이메일/비밀번호, Google OAuth)
- 인증된 사용자만 리뷰 작성 가능
- 1~5점 평점 + 텍스트 리뷰
- RLS 정책으로 본인 리뷰만 수정/삭제 가능
- 리뷰 작성/삭제 시 `destinations.avg_rating`, `camping_sites.avg_rating`, `review_count` 자동 갱신 (트리거)
- Rate limiting: 사용자당 분당 5개 리뷰 제한

### 7.2 Phase 2 (확장): 외부 장소 링크 제공

```
네이버 검색 API / 카카오 로컬 API → 외부 상세 링크 CTA 생성
```

- 네이버 플레이스 / 카카오맵 상세 페이지로 이동하는 링크를 노출
- `place_url` 또는 검색 결과 URL은 요청 시점에 계산하거나 별도 링크 필드로 저장
- 외부 리뷰 원문은 서비스 내부 DB에 적재하지 않음
- 내부 평점 집계는 `reviews` 테이블의 자체 리뷰만 사용

---

## 8. 데이터 캐싱 및 동기화 전략

### 8.1 캐시 레이어

```
┌─────────────────────────┐
│   Next.js fetch cache   │  ← 요청 수준 캐시 (revalidate)
├─────────────────────────┤
│   Supabase (PostgreSQL) │  ← 데이터 캐시 (destinations, weather_cache 지역 대표값)
├─────────────────────────┤
│   외부 API              │  ← 원본 데이터 소스
└─────────────────────────┘
```

### 8.2 캐시 정책

| 데이터 | 캐시 위치 | 갱신 주기 | 갱신 방법 |
|--------|----------|----------|----------|
| 여행지/맛집 | destinations | 24시간 | pg_cron 매일 03:00 |
| 캠핑장 | camping_sites | 24시간 | pg_cron 매일 03:30 |
| 날씨 | weather_cache (지역 대표 날씨) | 3시간 | pg_cron 매 3시간 |
| 레시피 | recipes | 7일 | 수동/Edge Function |
| 특산품 | specialties | 수동 | 관리자 갱신 |
| 지역 | regions | 변경 없음 | 초기 시드 |

### 8.3 런타임 캐시 플로우

```
1. 사용자 요청: GET /travel?areaCode=1
2. Server Component에서 Supabase 조회
3. 캐시 확인:
   - cached_at이 24시간 이내 → 캐시 데이터 반환
   - cached_at이 24시간 초과 → TourAPI 호출 → Supabase 갱신 → 반환
   - 데이터 없음 → TourAPI 호출 → Supabase 저장 → 반환
4. Next.js fetch 캐시 (ISR): revalidate = 3600 (1시간)
```

### 8.4 초기 데이터 시드

```
Supabase Edge Function: sync-initial-data
1. regions: 17개 시도 시드
2. destinations: 인기 여행지 top 100 (areaBasedList1, arrange=R)
3. recipes: COOKRCP01 전체 데이터 (배치 조회)
4. specialties: 수동 정리된 지역 특산품 데이터
5. weather_cache: 17개 시도 오늘+3일 날씨
6. camping_sites: 고캠핑 API 전체 캠핑장 데이터 (배치 조회)
```

### 8.5 에러 처리 및 폴백

```
외부 API 호출 실패 시:
1. Supabase 캐시 데이터가 있으면 → 캐시 데이터 반환 (stale 허용)
2. 캐시 데이터도 없으면 → 사용자에게 에러 메시지 + 재시도 버튼
3. API 호출 실패 로깅 (console.error + 향후 Sentry 연동)
```
