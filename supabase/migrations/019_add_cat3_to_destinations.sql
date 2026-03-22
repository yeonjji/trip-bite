-- 019: destinations 테이블에 cat3 카테고리 코드 컬럼 추가
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS cat3 TEXT;

COMMENT ON COLUMN destinations.cat3 IS '음식점(39) 카테고리: A05020100=한식, A05020200=서양식, A05020300=일식, A05020400=중식, A05020500=이색음식점, A05020600=카페/전통찻집';
