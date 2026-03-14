-- 017: 시군구 regions 계층 구조 + sigungu_code 인덱스

-- 1. regions 테이블에 parent_area_code 컬럼 추가
ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS parent_area_code text REFERENCES public.regions(area_code);

-- 2. sigungu_code 인덱스 추가 (검색 성능)
CREATE INDEX IF NOT EXISTS destinations_sigungu_idx
  ON public.destinations(sigungu_code);

CREATE INDEX IF NOT EXISTS pet_places_sigungu_idx
  ON public.pet_friendly_places(sigungu_code);

CREATE INDEX IF NOT EXISTS barrier_free_sigungu_idx
  ON public.barrier_free_places(sigungu_code);

CREATE INDEX IF NOT EXISTS regions_parent_idx
  ON public.regions(parent_area_code);
