# TourAPI 마스터 테이블 정규화 + DB-only 전환 설계

- **작성일**: 2026-05-16
- **트리거**: PR #44 이후 사용자 결정. "TourAPI 관련 데이터는 endpoint별 마스터 테이블로 분리하고, 페이지는 외부 호출 없이 DB select만 사용"
- **상태**: Draft (사용자 리뷰 대기)

## 1. 배경

PR #35-#44를 통해 상세 페이지 구조가 정리됨. 그러나 TourAPI 관련 데이터가 여전히 `destinations` row의 `intro_data` / `image_data` jsonb 컬럼에 묶여있어 다음 한계가 있음:

- **재수집 결합도**: 모든 sync가 destinations 행 UPDATE → 동시 sync 시 row lock 경합 가능
- **1:N 이미지 부자연스러움**: jsonb 배열 안에서 image-by-image 조작/필터링 어려움
- **약타입**: TypeScript는 jsonb를 `Record<string, unknown>`로 받아 호출 사이트에서 캐스팅 필요
- **NearbyTourSection 외부 호출 잔존**: 페이지에서 `tourApi.locationBasedList` ×3을 매 요청 호출 — TourAPI 한도 영향 직접

이 spec은 TourAPI 관련 데이터만 좁혀 endpoint별 마스터 테이블로 정규화하고, NearbyTourSection도 DB-only로 전환하는 작업을 정의함.

### 1.1 비-목표

- Kakao/Naver/기상청 등 다른 외부 API는 다루지 않음 (별도 Step 3a/4 spec)
- `destinations` 마스터 자체의 스키마 변경 없음
- 외국어 콘텐츠(EngService2 등) 활용은 별도 작업

## 2. 결정 사항 (브레인스토밍 합의)

| 결정 | 값 |
|---|---|
| 적용 범위 | TourAPI 관련 데이터만 |
| 아키텍처 방향 | 테이블 per endpoint 분리 + JOIN/RPC로 조립 |
| `destination_intros` 모델링 | 한 테이블 + `common_fields` jsonb + content_type별 `extras` jsonb |
| `destination_images` 모델링 | 1:N 테이블 (row 당 이미지 1개) |
| NearbyTourSection 대체 | PostGIS RPC + destinations/festivals 마스터 조회 |
| 재수집 전략 | 마이그레이션 후 증분 backfill (truncate 없음) |
| 작업 분할 | 단계별 여러 PR (PR1 인프라 → PR2 페이지 전환 → PR3 cleanup) |
| 메타 컬럼 명명 | 신규 테이블은 `synced_at` (마스터 적재 시각). 기존 `cached_at`은 호환 위해 유지 |

## 3. 새 DB 스키마

### 3.1 `destination_intros` (TourAPI `detailIntro2` 결과)

```sql
create table destination_intros (
  content_id      text primary key references destinations(content_id) on delete cascade,
  content_type_id text not null,
  common_fields   jsonb,           -- 공통 필드: infocenter/usetime/restdate/parking 등
  extras          jsonb,            -- content_type별 가변: firstmenu/opentimefood/expguide 등
  synced_at       timestamptz not null default now()
);

alter table destination_intros enable row level security;
create policy "Anyone can read destination_intros"
  on destination_intros for select using (true);
```

- `content_id`가 PK이자 FK → 1:1 관계
- `common_fields`/`extras` 분리는 단순 컨벤션. 페이지에서 사용 시 spread해 `TourSpotDetail`로 흡수.

### 3.2 `destination_images` (TourAPI `detailImage2` 결과)

```sql
create table destination_images (
  id          bigserial primary key,
  content_id  text not null references destinations(content_id) on delete cascade,
  origin_url  text not null,
  image_name  text,
  serial_num  int,
  synced_at   timestamptz not null default now()
);

create index destination_images_content_id_idx
  on destination_images(content_id, serial_num);

alter table destination_images enable row level security;
create policy "Anyone can read destination_images"
  on destination_images for select using (true);
```

- 1:N (한 destination당 이미지 N개)
- sync 시 기존 row 삭제 후 재삽입 (delete-then-insert) — 이미지 순서/누락 갱신 일관성 확보

### 3.3 `get_nearby_tour_items` RPC (NearbyTourSection용)

```sql
create or replace function get_nearby_tour_items(
  p_lat numeric,
  p_lng numeric,
  p_exclude text default null,            -- 제외할 content_id (현재 페이지)
  p_types text[] default array['12','15','32'],  -- content_type_id 배열 (12=여행지, 15=축제, 32=숙박)
  radius_meters int default 15000,
  result_limit int default 6
)
returns table (
  content_id text,
  content_type_id text,
  title text,
  addr1 text,
  first_image text,
  lat numeric,
  lng numeric,
  distance_km numeric
)
language sql stable
set search_path = public, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng::float8, p_lat::float8), 4326)::geography g
  )
  select
    d.content_id,
    d.content_type_id,
    d.title,
    d.addr1,
    d.first_image,
    d.mapy as lat,
    d.mapx as lng,
    round((st_distance(d.location, origin.g) / 1000)::numeric, 1) as distance_km
  from destinations d, origin
  where d.content_type_id = any(p_types)
    and d.location is not null
    and st_dwithin(d.location, origin.g, radius_meters)
    and (p_exclude is null or d.content_id <> p_exclude)
    and d.first_image is not null
  order by d.location <-> origin.g
  limit result_limit;
$$;

grant execute on function get_nearby_tour_items(numeric, numeric, text, text[], int, int)
  to anon, authenticated;
```

- `festivals` 마스터가 별도 테이블이지만 content_type_id='15' destinations에도 포함되어 있어 destinations 단일 쿼리로 충분 (현재 데이터 모델 기준)
- 만약 festivals 마스터가 destinations에 미반영이면 후속 RPC에 UNION 추가

## 4. Sync 스크립트 구조

### 4.1 기존 vs 신규

| 기존 | 신규 |
|---|---|
| `sync-destination-details.mjs` (1개 row마다 intro + image 함께 처리) | `sync-destination-intros.mjs` + `sync-destination-images.mjs` (분리) |

### 4.2 공통 패턴

신규 sync 두 스크립트가 모두 따르는 패턴 (이미 PR #39에서 확립):

- Resume: 해당 row가 신규 테이블에 없는 destination만 처리 (`left join` 또는 `is null`)
- Throttle: row 사이 150ms sleep
- 실패 격리: `failedIds: Set` — 영구 실패 row 다음 batch에서 제외
- 0-progress 종료: 한 batch 진전 0이면 종료 + `process.exit(1)`
- HTTP 에러 + `resultCode !== "0000"` 둘 다 throw → row stays NULL → 다음 실행에서 재시도
- 중복 station_id 같은 multi-row 케이스: dedup 후 upsert

### 4.3 `sync-destination-intros.mjs`

```js
// 처리 대상: destinations.content_id WHERE NOT IN (SELECT content_id FROM destination_intros)
// 각 row: tourApi.detailIntro(contentId, contentTypeId) 1회 → upsert
// common_fields/extras 분리는 컨벤션:
//   common = { infocenter, usetime, restdate, parking, useseason, ... }
//   extras = 위에 없는 모든 키
```

### 4.4 `sync-destination-images.mjs`

```js
// 처리 대상: destination_intros에는 있지만 destination_images에 row 0인 destination
//          OR destination_intros 없어도 처리 가능 (독립)
// 각 row: tourApi.detailImage(contentId) 1회 → 기존 row delete → 새 row insert
// 빈 응답: insert 0 row + destination_intros.synced_at가 sentinel 역할 (선택)
```

### 4.5 GitHub Actions

`.github/workflows/sync-destination-details.yml`을 단일 workflow + 2 step으로 구성:

```yaml
- name: Backfill intros
  run: node scripts/sync-destination-intros.mjs
- name: Backfill images
  run: node scripts/sync-destination-images.mjs
```

KST 02:00 매일 1회. 한도 초과 시 다음날 자동 resume.

## 5. 페이지/컴포넌트 변경

### 5.1 `getDestinationIntro` (DB-only, 시그니처 유지)

```ts
// 기존: destinations.intro_data jsonb 조회
// 신규: destination_intros 테이블 조회 → common_fields/extras spread해서 반환

export async function getDestinationIntro(contentId: string): Promise<TourSpotDetail | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("destination_intros")
    .select("common_fields, extras")
    .eq("content_id", contentId)
    .maybeSingle();
  if (!row) return null;
  return { ...(row.common_fields as object), ...(row.extras as object) } as TourSpotDetail;
}
```

### 5.2 `getDestinationImagesFromDb` (DB-only, 시그니처 유지)

```ts
export async function getDestinationImagesFromDb(contentId: string): Promise<TourImage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("destination_images")
    .select("origin_url, image_name, serial_num")
    .eq("content_id", contentId)
    .order("serial_num", { ascending: true });
  return (data ?? []).map((r) => ({
    originimgurl: r.origin_url,
    imgname: r.image_name ?? "",
    serialnum: r.serial_num ?? 0,
  } as TourImage));
}
```

### 5.3 `getNearbyTourRecommendations` DB-first

**Type 매핑**: 컴포넌트는 `'festival' | 'accommodation' | 'travel'` semantic key를 사용. 데이터 함수 내부에서 TourAPI content_type_id로 변환해 RPC에 전달.

```ts
const TYPE_TO_CONTENT_TYPE_ID: Record<NearbyTourType, string> = {
  travel: "12",
  festival: "15",
  accommodation: "32",
  restaurant: "39",
  cafe: "39",
};
```


```ts
// 기존: tourApi.locationBasedList ×3 (festival/accommodation/travel)
// 신규: rpc('get_nearby_tour_items', ...) 1회 + 결과를 type별 group

export async function getNearbyTourRecommendations({
  lat, lng, excludeContentId, types,
  limitPerType = 6,
}: NearbyTourArgs): Promise<NearbyTourRecommendations> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_nearby_tour_items", {
    p_lat: lat,
    p_lng: lng,
    p_exclude: excludeContentId ?? null,
    p_types: types.map(typeToContentTypeId),  // 'festival' → '15' 등
    result_limit: limitPerType,
  });
  return groupAndNormalize(data ?? [], types);
}
```

`getNearbyTourRecommendationsCached` unstable_cache 래퍼는 유지 (좌표 라운딩 키 → 메모리 캐시).

### 5.4 NearbyTourSection wrapper

내부 함수만 바뀜. wrapper 시그니처/JSX 변경 없음.

### 5.5 `tour-api.ts` 정리

`locationBasedList` 함수가 호출처 0이 되면 제거. `detailIntro`/`detailImage`는 sync 스크립트에서 여전히 사용.

## 6. PR 분할

### PR1 — DB 스키마 + sync 스크립트
- migration `040_destination_intros_images.sql`: 두 테이블 + 인덱스 + RLS
- migration `041_get_nearby_tour_items.sql`: RPC + GRANT EXECUTE
- `scripts/sync-destination-intros.mjs` 신규
- `scripts/sync-destination-images.mjs` 신규
- `.github/workflows/sync-destination-details.yml` 두 step으로 분리
- **page 코드는 손대지 않음** — backward compatible

### PR2 — 페이지/컴포넌트 DB-first 전환 (PR1 backfill 완료 후)
- `getDestinationIntro` / `getDestinationImagesFromDb` 본문 교체
- `getNearbyTourRecommendations` / `getNearbyTourRecommendationsCached` 본문 교체
- `tour-api.ts`에서 호출처 0인 함수 제거 (`locationBasedList`)
- 페이지/컴포넌트 외부 API 호출 0 달성

### PR3 — Cleanup (PR2 안정 후, 1주+ 모니터링 후)
- `destinations.intro_data` jsonb 컬럼 drop
- `destinations.image_data` jsonb 컬럼 drop
- `Destination` 타입에서 두 필드 제거
- `scripts/sync-destination-details.mjs` 삭제 (deprecated)

## 7. 운영자 deploy 시퀀스

각 PR 머지 시 운영자 작업:

**PR1 후**:
1. 마이그레이션 적용 (`supabase db push` 또는 콘솔)
2. 기존 jsonb 데이터를 새 테이블로 1회 이관 (선택 — 더 빠른 채움):
   ```sql
   INSERT INTO destination_intros (content_id, content_type_id, common_fields, extras)
   SELECT content_id, content_type_id, intro_data, '{}'::jsonb
   FROM destinations
   WHERE intro_data IS NOT NULL AND intro_data != '{}'::jsonb;
   -- images도 jsonb array를 unnest해서 row 단위로
   ```
3. 또는 백필 스크립트 1회 실행 (외부 호출 사용)
4. GH Actions cron이 매일 KST 02:00 자동 갱신

**PR2 후**: 페이지 동작 확인. 외부 호출 0 확인.

**PR3 후**: 1주일 이상 모니터링 후 적용. jsonb 컬럼 drop은 rollback이 어려움.

## 8. 위험 요소

| 위험 | 영향 | 대응 |
|---|---|---|
| PR1 후 backfill 시간 부족 시 일부 destinations에 intro/image 없음 | IntroSection 빈 상태 노출 | PR #44에서 이미 graceful — 섹션이 자연스럽게 사라짐 |
| jsonb → 신 테이블 데이터 이관 시 일부 row 누락 | 페이지 빈 상태 | sync 스크립트가 자동 채움. 운영자가 1회 확인 |
| `get_nearby_tour_items` RPC가 destinations만 보고 festivals 마스터 별도 미반영 | 축제 결과 부족 | content_type_id='15' destinations로 충분한지 데이터 확인. 부족 시 festivals 마스터 UNION 추가 |
| PR3에서 jsonb 컬럼 drop 후 rollback 어려움 | 데이터 손실 | 1주+ 안정 모니터링 후 drop. drop 전 백업 권장 |
| sync 두 스크립트 동시 실행 시 row lock | GitHub Actions step 순차 실행이라 영향 0 | 운영자 수동 실행 시 순차로 |
| TourAPI 한도 초과 | 그 날 backfill 일부 미완 | resume 패턴으로 다음날 자동 재시도 |

## 9. 미해결 질문 (구현 단계에서 결정)

- `common_fields` vs `extras` 분리 기준 — `TourSpotDetail` 공통 필드(15개 정도)를 common으로, 그 외 jsonb keys를 extras로. 구현 시 정확한 키 목록 확정.
- `destination_images.synced_at`이 row 단위 vs `destination_intros.synced_at`이 destination 단위 — 다른 의미인데 같은 이름. 구현 시 명확화.
- `get_nearby_tour_items` RPC가 destinations.location이 NULL인 row 처리 — 현재는 `is not null`로 필터. 충분.
- festivals 마스터 결합 필요성 — 우선 RPC를 destinations만 보고 만들고, 데이터 부족 시 후속 PR에서 UNION 추가.

## 10. 검증 계획

- PR1 머지 후 1주 backfill 진행률 확인
- PR2 머지 후 DevTools Network에서 `tourApi.locationBasedList`/`detailIntro`/`detailImage` 호출 0
- 상세 페이지 응답 시간: 22s (cold + lazy fallback) → ~5s (전체 streaming) → ~1s (warm + DB only)
- `select count(*) from destination_intros` ≈ `select count(*) from destinations`
