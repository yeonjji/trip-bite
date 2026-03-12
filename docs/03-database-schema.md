# 03-Database Schema

> **프로젝트**: 여행한입 (Trip Bite)
> **작성일**: 2026-03-11
> **버전**: 1.0
> **Database**: Supabase (PostgreSQL 15 + PostGIS)

---

## 1. 전체 ERD 개요

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   regions    │     │   destinations   │     │   reviews    │
│──────────────│     │──────────────────│     │──────────────│
│ area_code PK │◄────│ area_code FK     │     │ id PK        │
│ name_ko      │     │ id PK            │◄────│ destination_ │
│ name_en      │     │ content_id       │     │   id FK      │
│ image_url    │     │ content_type_id  │     │ camping_site_│
└──────────────┘     │ title_ko/en      │     │   id FK      │
                     │ accessibility    │     │ rating       │
                     │ avg_rating       │     │ content      │
                     │ review_count     │     │ user_id FK   │
                     └───────┬──────────┘     └──────────────┘
                             │
                     ┌───────┴──────────┐
                     │accessibility_info│
                     │──────────────────│
                     │ id PK            │
                     │ destination_id FK│
                     │ camping_site_id  │
                     │ target_group     │
                     │ info_ko/en       │
                     │ is_available     │
                     └──────────────────┘

┌──────────────┐     ┌──────────────────┐
│  specialties │     │    recipes       │
│──────────────│     │──────────────────│
│ id PK        │◄────│ specialty_id FK  │
│ region_code  │     │ id PK            │
│ name_ko/en   │     │ external_id      │
│ category     │     │ title_ko/en      │
│ season       │     │ ingredients      │
└──────────────┘     │ steps            │
                     │ cooking_time     │
                     └──────────────────┘

┌──────────────────┐
│  weather_cache   │
│──────────────────│
│ id PK            │
│ area_code        │
│ forecast_date    │
│ temperature      │
│ sky_condition    │
│ cached_at        │
└──────────────────┘

┌──────────────────┐
│  camping_sites   │
│──────────────────│
│ id PK            │
│ content_id       │
│ area_code FK     │→ regions
│ name_ko/en       │
│ induty           │
│ facilities JSONB │
│ animal_allowed   │
│ site_counts JSONB│
│ cached_at        │
└───────┬──────────┘
        │
┌───────┴──────────┐
│   reviews        │
│ camping_site_id  │ (nullable FK)
└──────────────────┘
```

---

## 2. 테이블 상세 스키마

### 2.1 regions (지역 메타데이터)

TourAPI의 지역 코드에 대응하는 메타데이터 테이블.

```sql
CREATE TABLE regions (
  area_code     INT PRIMARY KEY,
  name_ko       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  image_url     TEXT,
  description_ko TEXT,
  description_en TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  nx            INT,  -- 기상청 격자좌표 X
  ny            INT,  -- 기상청 격자좌표 Y
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 초기 시드 데이터 (17개 시도)
-- area_code: 1(서울), 2(인천), 3(대전), 4(대구), 5(광주),
--            6(부산), 7(울산), 8(세종), 31(경기), 32(강원),
--            33(충북), 34(충남), 35(경북), 36(경남), 37(전북),
--            38(전남), 39(제주)
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| area_code | INT | PK | TourAPI 지역코드 |
| name_ko | TEXT | NOT NULL | 한국어 지역명 |
| name_en | TEXT | NOT NULL | 영어 지역명 |
| image_url | TEXT | | 지역 대표 이미지 |
| description_ko | TEXT | | 한국어 설명 |
| description_en | TEXT | | 영어 설명 |
| latitude | DOUBLE PRECISION | | 대표 위도 |
| longitude | DOUBLE PRECISION | | 대표 경도 |
| nx | INT | | 기상청 격자좌표 X |
| ny | INT | | 기상청 격자좌표 Y |
| created_at | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 수정일 |

---

### 2.2 destinations (여행지/맛집 캐시)

TourAPI에서 가져온 여행지/맛집 데이터의 캐시 테이블.

```sql
CREATE TABLE destinations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      VARCHAR(20) UNIQUE NOT NULL,  -- TourAPI contentId
  content_type_id INT NOT NULL,                  -- 12:관광지, 14:문화시설, 15:축제, 25:여행코스, 28:레포츠, 39:음식점
  area_code       INT NOT NULL REFERENCES regions(area_code),
  sigungu_code    INT,

  -- 다국어 콘텐츠
  title_ko        TEXT NOT NULL,
  title_en        TEXT,
  overview_ko     TEXT,
  overview_en     TEXT,
  address_ko      TEXT,
  address_en      TEXT,

  -- 위치
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  geo_point       GEOMETRY(POINT, 4326),  -- PostGIS

  -- 미디어
  first_image     TEXT,
  tel             VARCHAR(50),

  -- 접근성 요약 (빠른 필터용)
  accessibility   JSONB DEFAULT '{}'::jsonb,
  -- 예: {"pet": true, "wheelchair": true, "foreigner": true}

  -- 리뷰 집계 캐시
  avg_rating      DECIMAL(3,2) DEFAULT 0,
  review_count    INT DEFAULT 0,

  -- 원본 데이터
  raw_data        JSONB,  -- TourAPI 원본 응답 전체 저장

  -- 메타
  cached_at       TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_destinations_area_code ON destinations(area_code);
CREATE INDEX idx_destinations_content_type ON destinations(content_type_id);
CREATE INDEX idx_destinations_area_type ON destinations(area_code, content_type_id);
CREATE INDEX idx_destinations_accessibility ON destinations USING GIN(accessibility);
CREATE INDEX idx_destinations_geo ON destinations USING GIST(geo_point);
CREATE INDEX idx_destinations_cached_at ON destinations(cached_at);
CREATE INDEX idx_destinations_avg_rating ON destinations(avg_rating DESC);

-- PostGIS geo_point 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_geo_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geo_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_destinations_geo_point
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_geo_point();

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_destinations_updated_at
  BEFORE UPDATE ON destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, auto | 내부 식별자 |
| content_id | VARCHAR(20) | UNIQUE, NOT NULL | TourAPI contentId |
| content_type_id | INT | NOT NULL | 콘텐츠 타입 (12,14,15,25,28,39) |
| area_code | INT | FK → regions | 지역 코드 |
| sigungu_code | INT | | 시군구 코드 |
| title_ko | TEXT | NOT NULL | 한국어 제목 |
| title_en | TEXT | | 영어 제목 |
| overview_ko | TEXT | | 한국어 개요 |
| overview_en | TEXT | | 영어 개요 |
| address_ko | TEXT | | 한국어 주소 |
| address_en | TEXT | | 영어 주소 |
| latitude | DOUBLE PRECISION | | 위도 |
| longitude | DOUBLE PRECISION | | 경도 |
| geo_point | GEOMETRY(POINT) | PostGIS | 지리 좌표 (자동 생성) |
| first_image | TEXT | | 대표 이미지 URL |
| tel | VARCHAR(50) | | 전화번호 |
| accessibility | JSONB | DEFAULT '{}' | 접근성 요약 플래그 |
| avg_rating | DECIMAL(3,2) | DEFAULT 0 | 평균 평점 (캐시) |
| review_count | INT | DEFAULT 0 | 리뷰 수 (캐시) |
| raw_data | JSONB | | TourAPI 원본 응답 |
| cached_at | TIMESTAMPTZ | DEFAULT now() | 캐시 시점 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 수정일 |

---

### 2.3 specialties (특산품)

```sql
CREATE TABLE specialties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code     INT NOT NULL REFERENCES regions(area_code),
  name_ko         TEXT NOT NULL,
  name_en         TEXT,
  description_ko  TEXT,
  description_en  TEXT,
  category        VARCHAR(50),  -- 농산물, 수산물, 축산물, 가공식품 등
  image_url       TEXT,
  season          VARCHAR(50),  -- 봄, 여름, 가을, 겨울, 연중
  season_months   INT[],        -- [3,4,5] = 3~5월
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_specialties_region ON specialties(region_code);
CREATE INDEX idx_specialties_category ON specialties(category);
CREATE INDEX idx_specialties_season ON specialties(season);
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, auto | 식별자 |
| region_code | INT | FK → regions | 지역 코드 |
| name_ko | TEXT | NOT NULL | 한국어 이름 |
| name_en | TEXT | | 영어 이름 |
| description_ko | TEXT | | 한국어 설명 |
| description_en | TEXT | | 영어 설명 |
| category | VARCHAR(50) | | 카테고리 |
| image_url | TEXT | | 이미지 URL |
| season | VARCHAR(50) | | 제철 (봄/여름/가을/겨울/연중) |
| season_months | INT[] | | 제철 월 배열 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 수정일 |

---

### 2.4 recipes (레시피)

```sql
CREATE TABLE recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     VARCHAR(50),   -- COOKRCP01 API ID
  specialty_id    UUID REFERENCES specialties(id) ON DELETE SET NULL,

  -- 다국어 콘텐츠
  title_ko        TEXT NOT NULL,
  title_en        TEXT,
  ingredients_ko  TEXT[],         -- 한국어 재료 목록
  ingredients_en  TEXT[],         -- 영어 재료 목록

  -- 조리 단계
  steps           JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- 예: [{"step": 1, "description_ko": "...", "description_en": "...", "image_url": "..."}]

  -- 메타
  cooking_time    INT,            -- 분 단위
  difficulty      VARCHAR(20),    -- easy, medium, hard
  calorie         DECIMAL(8,2),   -- kcal
  servings        INT,            -- 인분
  main_image      TEXT,           -- 대표 이미지

  -- 영양소 (선택)
  nutrition       JSONB,
  -- 예: {"carbs": 50, "protein": 20, "fat": 10, "sodium": 500}

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recipes_specialty ON recipes(specialty_id);
CREATE INDEX idx_recipes_external ON recipes(external_id);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, auto | 식별자 |
| external_id | VARCHAR(50) | | COOKRCP01 API ID |
| specialty_id | UUID | FK → specialties (SET NULL) | 연결된 특산품 |
| title_ko | TEXT | NOT NULL | 한국어 제목 |
| title_en | TEXT | | 영어 제목 |
| ingredients_ko | TEXT[] | | 한국어 재료 |
| ingredients_en | TEXT[] | | 영어 재료 |
| steps | JSONB | NOT NULL, DEFAULT '[]' | 조리 단계 |
| cooking_time | INT | | 조리 시간 (분) |
| difficulty | VARCHAR(20) | | 난이도 |
| calorie | DECIMAL(8,2) | | 칼로리 (kcal) |
| servings | INT | | 인분 |
| main_image | TEXT | | 대표 이미지 |
| nutrition | JSONB | | 영양소 상세 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 수정일 |

---

### 2.5 reviews (리뷰/평점)

MVP 기준으로 `reviews` 테이블은 사용자 작성 리뷰만 저장한다. 네이버/카카오 외부 장소 상세 링크는 UI에서 별도로 제공하며, 외부 리뷰 원문을 이 테이블에 적재하지 않는다.

```sql
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID REFERENCES destinations(id) ON DELETE CASCADE,
  camping_site_id UUID REFERENCES camping_sites(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating          DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content         TEXT,
  author_display_name VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_review_target
    CHECK (num_nonnulls(destination_id, camping_site_id) = 1)
);

CREATE INDEX idx_reviews_destination
  ON reviews(destination_id)
  WHERE destination_id IS NOT NULL;

CREATE INDEX idx_reviews_camping_site
  ON reviews(camping_site_id)
  WHERE camping_site_id IS NOT NULL;

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_destination_rating
  ON reviews(destination_id, rating)
  WHERE destination_id IS NOT NULL;

CREATE INDEX idx_reviews_camping_rating
  ON reviews(camping_site_id, rating)
  WHERE camping_site_id IS NOT NULL;

-- 리뷰 생성/수정/삭제 시 destinations / camping_sites 평균 평점 자동 갱신
CREATE OR REPLACE FUNCTION refresh_review_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  dest_id UUID;
  camp_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    dest_id := OLD.destination_id;
    camp_id := OLD.camping_site_id;
  ELSE
    dest_id := NEW.destination_id;
    camp_id := NEW.camping_site_id;
  END IF;

  IF dest_id IS NOT NULL THEN
    UPDATE destinations SET
      avg_rating = COALESCE(
        (SELECT AVG(rating) FROM reviews WHERE destination_id = dest_id),
        0
      ),
      review_count = (SELECT COUNT(*) FROM reviews WHERE destination_id = dest_id)
    WHERE id = dest_id;
  END IF;

  IF camp_id IS NOT NULL THEN
    UPDATE camping_sites SET
      avg_rating = COALESCE(
        (SELECT AVG(rating) FROM reviews WHERE camping_site_id = camp_id),
        0
      ),
      review_count = (SELECT COUNT(*) FROM reviews WHERE camping_site_id = camp_id)
    WHERE id = camp_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_rating
  AFTER INSERT OR UPDATE OR DELETE
  ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION refresh_review_aggregates();
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, auto | 식별자 |
| destination_id | UUID | FK → destinations (CASCADE) | 대상 여행지 (nullable) |
| camping_site_id | UUID | FK → camping_sites (CASCADE) | 대상 캠핑장 (nullable) |
| user_id | UUID | FK → auth.users (CASCADE), NOT NULL | 작성자 |
| rating | DECIMAL(2,1) | NOT NULL, CHECK 1~5 | 평점 |
| content | TEXT | | 리뷰 내용 |
| author_display_name | VARCHAR(100) | | 표시용 작성자명 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 수정일 |

---

### 2.6 weather_cache (날씨 캐시)

MVP에서는 `weather_cache`를 `area_code` 기준 대표 격자 좌표로 운영한다. 즉, 상세 페이지에 노출되는 날씨는 개별 장소 초정밀 예보가 아니라 여행지가 속한 지역의 대표 날씨다.

```sql
CREATE TABLE weather_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code       INT NOT NULL REFERENCES regions(area_code),  -- 지역 대표 좌표 기준
  forecast_date   DATE NOT NULL,
  forecast_time   VARCHAR(4),     -- "0600", "1200" 등

  temperature_min DECIMAL(4,1),
  temperature_max DECIMAL(4,1),
  temperature_cur DECIMAL(4,1),   -- 현재 기온
  sky_condition   VARCHAR(20),    -- clear, cloudy, overcast, rainy, snowy
  precipitation   VARCHAR(20),    -- none, rain, rain_snow, snow, shower
  precipitation_amount VARCHAR(20), -- "1~4mm" 등
  humidity        INT,
  wind_speed      DECIMAL(4,1),

  raw_data        JSONB,          -- 기상청 API 원본

  cached_at       TIMESTAMPTZ DEFAULT now()
);

-- 같은 지역+날짜+시간에 대한 중복 방지
CREATE UNIQUE INDEX idx_weather_unique
  ON weather_cache(area_code, forecast_date, forecast_time);

CREATE INDEX idx_weather_area_date
  ON weather_cache(area_code, forecast_date);

CREATE INDEX idx_weather_cached_at
  ON weather_cache(cached_at);
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, auto | 식별자 |
| area_code | INT | FK → regions | 지역 코드 |
| forecast_date | DATE | NOT NULL | 예보 날짜 |
| forecast_time | VARCHAR(4) | | 예보 시간 |
| temperature_min | DECIMAL(4,1) | | 최저기온 |
| temperature_max | DECIMAL(4,1) | | 최고기온 |
| temperature_cur | DECIMAL(4,1) | | 현재기온 |
| sky_condition | VARCHAR(20) | | 하늘상태 |
| precipitation | VARCHAR(20) | | 강수형태 |
| precipitation_amount | VARCHAR(20) | | 강수량 |
| humidity | INT | | 습도 (%) |
| wind_speed | DECIMAL(4,1) | | 풍속 (m/s) |
| raw_data | JSONB | | 기상청 원본 응답 |
| cached_at | TIMESTAMPTZ | DEFAULT now() | 캐시 시점 |

---

### 2.7 accessibility_info (접근성 정보)

```sql
CREATE TABLE accessibility_info (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID REFERENCES destinations(id) ON DELETE CASCADE,
  camping_site_id UUID REFERENCES camping_sites(id) ON DELETE CASCADE,
  target_group    VARCHAR(20) NOT NULL,
  -- pet, wheelchair, foreigner, elderly, child

  info_ko         TEXT,
  info_en         TEXT,
  is_available    BOOLEAN DEFAULT false,

  details         JSONB DEFAULT '{}'::jsonb,
  -- pet: {"size_limit": "소형견", "leash_required": true, "indoor_allowed": false}
  -- wheelchair: {"ramp": true, "elevator": true, "accessible_restroom": true, "parking": true}
  -- foreigner: {"english_menu": true, "multilingual_staff": ["en", "zh"], "english_signage": true}
  -- elderly: {"rest_area": true, "handrail": true}
  -- child: {"stroller_rental": true, "nursing_room": true, "kids_menu": true}

  source          VARCHAR(20) DEFAULT 'tourapi',  -- tourapi, manual
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_accessibility_target
    CHECK (num_nonnulls(destination_id, camping_site_id) = 1)
);

-- 같은 대상+대상그룹 중복 방지
CREATE UNIQUE INDEX idx_accessibility_destination_unique
  ON accessibility_info(destination_id, target_group)
  WHERE destination_id IS NOT NULL;

CREATE UNIQUE INDEX idx_accessibility_camping_unique
  ON accessibility_info(camping_site_id, target_group)
  WHERE camping_site_id IS NOT NULL;

CREATE INDEX idx_accessibility_destination
  ON accessibility_info(destination_id)
  WHERE destination_id IS NOT NULL;

CREATE INDEX idx_accessibility_camping_site
  ON accessibility_info(camping_site_id)
  WHERE camping_site_id IS NOT NULL;

CREATE INDEX idx_accessibility_target
  ON accessibility_info(target_group);

CREATE INDEX idx_accessibility_available
  ON accessibility_info(target_group, is_available)
  WHERE is_available = true;
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, auto | 식별자 |
| destination_id | UUID | FK → destinations (CASCADE) | 대상 여행지 (nullable) |
| camping_site_id | UUID | FK → camping_sites (CASCADE) | 대상 캠핑장 (nullable) |
| target_group | VARCHAR(20) | NOT NULL | 대상 그룹 |
| info_ko | TEXT | | 한국어 접근성 정보 |
| info_en | TEXT | | 영어 접근성 정보 |
| is_available | BOOLEAN | DEFAULT false | 이용 가능 여부 |
| details | JSONB | DEFAULT '{}' | 그룹별 상세 정보 |
| source | VARCHAR(20) | DEFAULT 'tourapi' | 데이터 출처 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 수정일 |

---

### 2.8 camping_sites (캠핑장)

고캠핑 API에서 가져온 캠핑장 데이터의 캐시 테이블. 캠핑 전용 필드(사이트 유형, 바닥 타입, 운영 기간 등)가 destinations와 크게 상이하여 별도 테이블로 분리.

```sql
CREATE TABLE camping_sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      VARCHAR(20) UNIQUE NOT NULL,  -- 고캠핑 API contentId
  area_code       INT NOT NULL REFERENCES regions(area_code),

  -- 다국어 콘텐츠
  name_ko         TEXT NOT NULL,
  name_en         TEXT,
  address_ko      TEXT,
  address_en      TEXT,
  overview_ko     TEXT,
  overview_en     TEXT,

  -- 위치
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  geo_point       GEOMETRY(POINT, 4326),  -- PostGIS
  tel             VARCHAR(50),
  homepage        TEXT,

  -- 캠핑장 유형
  induty          VARCHAR(100),  -- 업종 (일반야영장, 자동차야영장, 카라반, 글램핑)

  -- 부대시설
  facilities      JSONB DEFAULT '[]'::jsonb,
  -- 예: ["전기", "무선인터넷", "장작판매", "온수", "놀이터", "산책로"]

  nearby_facilities JSONB DEFAULT '[]'::jsonb,
  -- 예: ["계곡", "해수욕장", "낚시", "청소년수련시설"]

  -- 사이트 수
  site_counts     JSONB DEFAULT '{}'::jsonb,
  -- 예: {"general": 50, "auto": 20, "glamping": 10, "caravan": 5, "individual_caravan": 3}

  -- 접근성
  animal_allowed  VARCHAR(20),   -- 가능, 불가능, 소형견
  trailer_allowed BOOLEAN DEFAULT false,
  caravan_allowed BOOLEAN DEFAULT false,

  -- 운영 정보
  operation_season VARCHAR(50),  -- 봄,여름,가을,겨울
  operation_days  VARCHAR(50),   -- 평일+주말 등
  off_start       DATE,          -- 휴장 시작일
  off_end         DATE,          -- 휴장 종료일

  -- 사이트 바닥 타입별 수
  site_bottom_types JSONB DEFAULT '{}'::jsonb,
  -- 예: {"grass": 30, "crushed_stone": 10, "deck": 15, "gravel": 5, "dirt": 0}

  -- 기타
  brazier_type    VARCHAR(20),   -- 개별, 불가
  first_image     TEXT,

  -- 리뷰 집계 캐시
  avg_rating      DECIMAL(3,2) DEFAULT 0,
  review_count    INT DEFAULT 0,

  -- 원본 데이터
  raw_data        JSONB,  -- 고캠핑 API 원본 응답 전체 저장

  -- 메타
  cached_at       TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_camping_area_code ON camping_sites(area_code);
CREATE INDEX idx_camping_induty ON camping_sites(induty);
CREATE INDEX idx_camping_animal ON camping_sites(animal_allowed);
CREATE INDEX idx_camping_facilities ON camping_sites USING GIN(facilities);
CREATE INDEX idx_camping_geo ON camping_sites USING GIST(geo_point);
CREATE INDEX idx_camping_cached_at ON camping_sites(cached_at);
CREATE INDEX idx_camping_avg_rating ON camping_sites(avg_rating DESC);

-- PostGIS geo_point 자동 갱신 트리거 (destinations와 동일 함수 재사용)
CREATE TRIGGER trg_camping_geo_point
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON camping_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_geo_point();

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trg_camping_updated_at
  BEFORE UPDATE ON camping_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, auto | 내부 식별자 |
| content_id | VARCHAR(20) | UNIQUE, NOT NULL | 고캠핑 API contentId |
| area_code | INT | FK → regions | 지역 코드 |
| name_ko | TEXT | NOT NULL | 한국어 이름 |
| name_en | TEXT | | 영어 이름 |
| address_ko | TEXT | | 한국어 주소 |
| address_en | TEXT | | 영어 주소 |
| overview_ko | TEXT | | 한국어 소개 |
| overview_en | TEXT | | 영어 소개 |
| latitude | DOUBLE PRECISION | | 위도 |
| longitude | DOUBLE PRECISION | | 경도 |
| geo_point | GEOMETRY(POINT) | PostGIS | 지리 좌표 (자동 생성) |
| tel | VARCHAR(50) | | 전화번호 |
| homepage | TEXT | | 홈페이지 URL |
| induty | VARCHAR(100) | | 업종 (일반야영장/자동차야영장/카라반/글램핑) |
| facilities | JSONB | DEFAULT '[]' | 부대시설 목록 |
| nearby_facilities | JSONB | DEFAULT '[]' | 주변시설 목록 |
| site_counts | JSONB | DEFAULT '{}' | 사이트 유형별 수 |
| animal_allowed | VARCHAR(20) | | 반려동물 (가능/불가능/소형견) |
| trailer_allowed | BOOLEAN | DEFAULT false | 트레일러 동반 가능 |
| caravan_allowed | BOOLEAN | DEFAULT false | 카라반 동반 가능 |
| operation_season | VARCHAR(50) | | 운영 계절 |
| operation_days | VARCHAR(50) | | 운영일 |
| off_start | DATE | | 휴장 시작일 |
| off_end | DATE | | 휴장 종료일 |
| site_bottom_types | JSONB | DEFAULT '{}' | 바닥 타입별 사이트 수 |
| brazier_type | VARCHAR(20) | | 화로대 (개별/불가) |
| first_image | TEXT | | 대표 이미지 URL |
| avg_rating | DECIMAL(3,2) | DEFAULT 0 | 평균 평점 (캐시) |
| review_count | INT | DEFAULT 0 | 리뷰 수 (캐시) |
| raw_data | JSONB | | 고캠핑 API 원본 응답 |
| cached_at | TIMESTAMPTZ | DEFAULT now() | 캐시 시점 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 수정일 |

---

## 3. 인덱스 전략 요약

| 테이블 | 인덱스 | 타입 | 용도 |
|--------|--------|------|------|
| destinations | area_code | B-tree | 지역별 필터 |
| destinations | content_type_id | B-tree | 타입별 필터 |
| destinations | (area_code, content_type_id) | B-tree 복합 | 지역+타입 복합 필터 |
| destinations | accessibility | GIN | JSONB 접근성 필터 |
| destinations | geo_point | GiST | 위치 기반 검색 (PostGIS) |
| destinations | cached_at | B-tree | 캐시 갱신 대상 조회 |
| destinations | avg_rating DESC | B-tree | 평점순 정렬 |
| specialties | region_code | B-tree | 지역별 특산품 |
| specialties | category | B-tree | 카테고리 필터 |
| specialties | season | B-tree | 제철 필터 |
| recipes | specialty_id | B-tree | 특산품별 레시피 |
| recipes | external_id | B-tree | 외부 ID 조회 |
| reviews | destination_id | B-tree | 여행지별 리뷰 |
| reviews | camping_site_id | B-tree | 캠핑장별 리뷰 |
| reviews | user_id | B-tree | 사용자별 리뷰 |
| reviews | (destination_id, rating) | B-tree 복합 | 여행지 평점 집계 |
| reviews | (camping_site_id, rating) | B-tree 복합 | 캠핑장 평점 집계 |
| weather_cache | (area_code, forecast_date, forecast_time) | B-tree UNIQUE | 캐시 키 |
| accessibility_info | (destination_id, target_group) | B-tree UNIQUE | 여행지 중복 방지 |
| accessibility_info | (camping_site_id, target_group) | B-tree UNIQUE | 캠핑장 중복 방지 |
| accessibility_info | (target_group, is_available) | B-tree 부분 | 가용 필터 |
| camping_sites | area_code | B-tree | 지역별 필터 |
| camping_sites | induty | B-tree | 업종별 필터 |
| camping_sites | animal_allowed | B-tree | 반려동물 필터 |
| camping_sites | facilities | GIN | JSONB 시설 필터 |
| camping_sites | geo_point | GiST | 위치 기반 검색 (PostGIS) |
| camping_sites | cached_at | B-tree | 캐시 갱신 대상 조회 |
| camping_sites | avg_rating DESC | B-tree | 평점순 정렬 |

---

## 4. 관계 설명

```
regions (1) ──── (N) destinations      지역은 여러 여행지를 가짐
regions (1) ──── (N) specialties       지역은 여러 특산품을 가짐
regions (1) ──── (N) weather_cache     지역은 여러 날씨 캐시를 가짐

destinations (1) ──── (N) reviews            여행지는 여러 리뷰를 가짐
destinations (1) ──── (N) accessibility_info 여행지는 여러 접근성 정보를 가짐

specialties (1) ──── (N) recipes       특산품은 여러 레시피와 연결

auth.users (1) ──── (N) reviews        사용자는 여러 리뷰를 작성

regions (1) ──── (N) camping_sites     지역은 여러 캠핑장을 가짐

camping_sites (1) ──── (N) reviews           캠핑장은 여러 리뷰를 가짐
camping_sites (1) ──── (N) accessibility_info 캠핑장은 여러 접근성 정보를 가짐
```

---

## 5. Supabase RLS (Row Level Security) 정책

### 5.1 공개 읽기 테이블

```sql
-- regions: 모든 사용자 읽기 가능
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regions_select" ON regions FOR SELECT USING (true);

-- destinations: 모든 사용자 읽기 가능
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "destinations_select" ON destinations FOR SELECT USING (true);

-- specialties: 모든 사용자 읽기 가능
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialties_select" ON specialties FOR SELECT USING (true);

-- recipes: 모든 사용자 읽기 가능
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (true);

-- weather_cache: 모든 사용자 읽기 가능
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weather_select" ON weather_cache FOR SELECT USING (true);

-- accessibility_info: 모든 사용자 읽기 가능
ALTER TABLE accessibility_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accessibility_select" ON accessibility_info FOR SELECT USING (true);

-- camping_sites: 모든 사용자 읽기 가능
ALTER TABLE camping_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camping_sites_select" ON camping_sites FOR SELECT USING (true);
```

### 5.2 리뷰 테이블 (인증 기반)

```sql
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 가능
CREATE POLICY "reviews_select"
  ON reviews FOR SELECT
  USING (true);

-- 인증된 사용자만 리뷰 작성
CREATE POLICY "reviews_insert"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND num_nonnulls(destination_id, camping_site_id) = 1
  );

-- 본인 리뷰만 수정
CREATE POLICY "reviews_update"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND num_nonnulls(destination_id, camping_site_id) = 1
  );

-- 본인 리뷰만 삭제
CREATE POLICY "reviews_delete"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.3 서비스 역할 (데이터 동기화)

```sql
-- service_role 키로 접근 시 모든 테이블 CRUD 가능
-- (Supabase 기본 동작: service_role은 RLS 우회)
-- Edge Functions에서 service_role 키 사용하여 데이터 시드/갱신
```

---

## 6. 마이그레이션 순서

```
001_extensions.sql        ← PostGIS, pg_cron, pg_net 확장 활성화
002_helper_functions.sql  ← update_updated_at() 등 공통 함수
003_regions.sql           ← regions 테이블 + 시드 데이터 (17개 시도)
004_destinations.sql      ← destinations 테이블 + 인덱스 + 트리거
005_camping_sites.sql     ← camping_sites 테이블 + 인덱스 + 트리거
006_specialties.sql       ← specialties 테이블 + 인덱스
007_recipes.sql           ← recipes 테이블 + 인덱스
008_reviews.sql           ← reviews 테이블 + 인덱스 + 평점 트리거
009_weather_cache.sql     ← weather_cache 테이블 + 인덱스
010_accessibility_info.sql ← accessibility_info 테이블 + 인덱스
011_rls_policies.sql      ← 모든 테이블 RLS 정책
012_cron_jobs.sql         ← pg_cron 스케줄링 (데이터 갱신)
```

### 마이그레이션 의존관계

```
001 → 002 → 003 → 004
               ├──── 005 → 008 → 010
               ├──── 006 → 007
               └──── 009

011 (모든 테이블 생성 후)
012 (모든 테이블 생성 후)
```

- `008_reviews.sql`는 `004_destinations.sql`과 `005_camping_sites.sql` 이후 실행
- `010_accessibility_info.sql`는 `004_destinations.sql`과 `005_camping_sites.sql` 이후 실행

---

## 7. pg_cron 스케줄 작업

`net.http_post`를 사용하므로 `pg_cron`과 함께 `pg_net` 확장이 활성화되어 있어야 한다.

```sql
-- 001: 매일 새벽 3시 - 여행지 데이터 갱신 (24시간 이상 경과 데이터)
SELECT cron.schedule(
  'refresh-destinations',
  '0 3 * * *',
  $$SELECT net.http_post(
    'https://<project-ref>.supabase.co/functions/v1/sync-destinations',
    '{}',
    '{"Authorization": "Bearer <service-role-key>"}'
  )$$
);

-- 002: 3시간마다 - 날씨 데이터 갱신
SELECT cron.schedule(
  'refresh-weather',
  '0 */3 * * *',
  $$SELECT net.http_post(
    'https://<project-ref>.supabase.co/functions/v1/sync-weather',
    '{}',
    '{"Authorization": "Bearer <service-role-key>"}'
  )$$
);

-- 003: 매일 새벽 4시 - 오래된 날씨 캐시 정리 (7일 이상)
SELECT cron.schedule(
  'cleanup-weather-cache',
  '0 4 * * *',
  $$DELETE FROM weather_cache WHERE cached_at < now() - interval '7 days'$$
);

-- 004: 매일 새벽 3시 30분 - 캠핑장 데이터 갱신 (24시간 이상 경과 데이터)
SELECT cron.schedule(
  'refresh-camping',
  '30 3 * * *',
  $$SELECT net.http_post(
    'https://<project-ref>.supabase.co/functions/v1/sync-camping',
    '{}',
    '{"Authorization": "Bearer <service-role-key>"}'
  )$$
);
```
