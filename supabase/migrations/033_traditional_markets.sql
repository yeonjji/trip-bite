CREATE TABLE IF NOT EXISTS public.traditional_markets (
  id          bigserial PRIMARY KEY,
  mkt_id      text UNIQUE NOT NULL,
  mkt_nm      text NOT NULL,
  rdn_adr     text,
  lnm_adr     text,
  sido_nm     text,
  sgg_nm      text,
  mkt_tp_nm   text,
  area_cd     text,
  parking_yn  text,
  lat         numeric,
  lng         numeric,
  itg_mkt_yn  text,
  scsfl_tp_nm text,
  tel_no      text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS traditional_markets_sido_nm_idx ON public.traditional_markets(sido_nm);
CREATE INDEX IF NOT EXISTS traditional_markets_sgg_nm_idx  ON public.traditional_markets(sgg_nm);
CREATE INDEX IF NOT EXISTS traditional_markets_lat_lng_idx ON public.traditional_markets(lat, lng);

ALTER TABLE public.traditional_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.traditional_markets
  FOR SELECT USING (true);
