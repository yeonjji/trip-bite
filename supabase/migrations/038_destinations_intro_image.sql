-- Step 2: destinations에 TourAPI detailIntro / detailImage 응답 저장 컬럼 추가
-- 페이지가 매 요청마다 외부 호출하지 않도록 DB-first 전환.

alter table public.destinations
  add column if not exists intro_data jsonb,
  add column if not exists image_data jsonb;

comment on column public.destinations.intro_data is
  'TourAPI detailIntro2 응답 (content_type_id별 스키마 상이). null이면 미백필 상태.';
comment on column public.destinations.image_data is
  'TourAPI detailImage2 응답 (TourImage[]). null이면 미백필, [] 이면 이미지 없음으로 백필됨.';
