-- 공중화장실: sigungu_name 컬럼 추가 (address_road 두 번째 단어 추출)
ALTER TABLE public.public_toilets
  ADD COLUMN IF NOT EXISTS sigungu_name text;

UPDATE public.public_toilets
SET sigungu_name = TRIM(SPLIT_PART(address_road, ' ', 2))
WHERE sigungu_name IS NULL
  AND address_road IS NOT NULL
  AND address_road != '';

CREATE INDEX IF NOT EXISTS public_toilets_sigungu_idx
  ON public.public_toilets(area_code, sigungu_name);

-- 전기차 충전기: sigungu_name 컬럼 추가 (addr 두 번째 단어 추출)
ALTER TABLE public.ev_chargers
  ADD COLUMN IF NOT EXISTS sigungu_name text;

UPDATE public.ev_chargers
SET sigungu_name = TRIM(SPLIT_PART(addr, ' ', 2))
WHERE sigungu_name IS NULL
  AND addr IS NOT NULL
  AND addr != '';

CREATE INDEX IF NOT EXISTS ev_chargers_sigungu_idx
  ON public.ev_chargers(zcode, sigungu_name);

-- ev_stations 뷰 재생성 (sigungu_name 포함)
CREATE OR REPLACE VIEW public.ev_stations AS
SELECT
  stat_id,
  MAX(stat_nm)                                    AS stat_nm,
  MAX(addr)                                       AS addr,
  MAX(sigungu_name)                               AS sigungu_name,
  AVG(lat)                                        AS lat,
  AVG(lng)                                        AS lng,
  MAX(busi_nm)                                    AS busi_nm,
  MAX(busi_call)                                  AS busi_call,
  MAX(use_time)                                   AS use_time,
  MAX(parking_free)                               AS parking_free,
  MAX(limit_yn)                                   AS limit_yn,
  MAX(zcode)                                      AS zcode,
  MAX(zscode)                                     AS zscode,
  COUNT(*)                                        AS charger_count,
  BOOL_OR(NULLIF(output, '')::numeric > 22)       AS has_fast,
  BOOL_OR(NULLIF(output, '') IS NOT NULL
    AND NULLIF(output, '')::numeric <= 22)         AS has_slow,
  MAX(NULLIF(output, '')::numeric)                AS max_output
FROM public.ev_chargers
WHERE del_yn IS DISTINCT FROM 'Y'
GROUP BY stat_id;

GRANT SELECT ON public.ev_stations TO anon;
GRANT SELECT ON public.ev_stations TO authenticated;
