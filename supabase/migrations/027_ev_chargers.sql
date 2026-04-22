-- 전기차 충전기 정보 (한국환경공단 B552584/EvCharger)
-- 충전기 단위로 저장, 충전소 단위 집계는 ev_stations 뷰로 제공

CREATE TABLE IF NOT EXISTS public.ev_chargers (
  stat_id      text NOT NULL,
  chger_id     text NOT NULL,
  stat_nm      text NOT NULL DEFAULT '',
  chger_type   text,
  addr         text,
  lat          numeric(11,7),
  lng          numeric(11,7),
  use_time     text,
  busi_id      text,
  bnm          text,
  busi_nm      text,
  busi_call    text,
  output       text,
  method       text,
  zcode        text,
  zscode       text,
  kind         text,         -- 1=급속, 2=완속 (API 원본값)
  kind_detail  text,
  parking_free text,
  limit_yn     text,
  limit_detail text,
  del_yn       text,
  note         text,
  synced_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stat_id, chger_id)
);

CREATE INDEX IF NOT EXISTS ev_chargers_stat_id_idx ON public.ev_chargers(stat_id);
CREATE INDEX IF NOT EXISTS ev_chargers_zcode_idx   ON public.ev_chargers(zcode);
CREATE INDEX IF NOT EXISTS ev_chargers_zscode_idx  ON public.ev_chargers(zscode);
CREATE INDEX IF NOT EXISTS ev_chargers_kind_idx    ON public.ev_chargers(kind);

ALTER TABLE public.ev_chargers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ev_chargers"
  ON public.ev_chargers FOR SELECT USING (true);

-- 충전소 단위 집계 뷰 (목록 페이지용)
CREATE OR REPLACE VIEW public.ev_stations AS
SELECT
  stat_id,
  MAX(stat_nm)                                    AS stat_nm,
  MAX(addr)                                       AS addr,
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
  BOOL_OR(kind IN ('1', '01'))                    AS has_fast,
  BOOL_OR(kind IN ('2', '02'))                    AS has_slow,
  MAX(NULLIF(output, '')::numeric)                AS max_output
FROM public.ev_chargers
WHERE del_yn IS DISTINCT FROM 'Y'
GROUP BY stat_id;

GRANT SELECT ON public.ev_stations TO anon;
GRANT SELECT ON public.ev_stations TO authenticated;
