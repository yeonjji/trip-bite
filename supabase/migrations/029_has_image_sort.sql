-- destinations, camping_sites 테이블에 has_image 생성 컬럼 추가
-- 이미지 있는 항목이 목록 상단에 오도록 정렬에 활용

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS has_image boolean
  GENERATED ALWAYS AS (first_image IS NOT NULL) STORED;

CREATE INDEX IF NOT EXISTS destinations_has_image_rating_idx
  ON public.destinations(has_image DESC, rating_avg DESC);

ALTER TABLE public.camping_sites
  ADD COLUMN IF NOT EXISTS has_image boolean
  GENERATED ALWAYS AS (first_image_url IS NOT NULL) STORED;

CREATE INDEX IF NOT EXISTS camping_sites_has_image_rating_idx
  ON public.camping_sites(has_image DESC, rating_avg DESC);
