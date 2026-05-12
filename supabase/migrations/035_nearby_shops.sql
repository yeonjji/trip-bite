SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS nearby_shops (
  id             bigserial PRIMARY KEY,
  bizes_id       text NOT NULL UNIQUE,
  bizes_nm       text NOT NULL,
  brch_nm        text,
  inds_lcls_cd   text,
  inds_lcls_nm   text,
  inds_mcls_cd   text,
  inds_mcls_nm   text,
  inds_scls_cd   text,
  inds_scls_nm   text,
  category_group text NOT NULL,
  rdnm_adr       text,
  lno_adr        text,
  lat            numeric(10,7),
  lng            numeric(10,7),
  cached_at      timestamptz DEFAULT now(),
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nearby_shops_lat_lng_idx
  ON nearby_shops (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS nearby_shops_category_group_idx
  ON nearby_shops (category_group);

CREATE INDEX IF NOT EXISTS nearby_shops_cached_at_idx
  ON nearby_shops (cached_at);

CREATE OR REPLACE FUNCTION get_nearby_shops(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 1000,
  result_limit  int     DEFAULT 5,
  p_category    text    DEFAULT NULL
)
RETURNS TABLE (
  id             bigint,
  bizes_id       text,
  bizes_nm       text,
  brch_nm        text,
  inds_lcls_nm   text,
  inds_mcls_nm   text,
  inds_scls_nm   text,
  category_group text,
  rdnm_adr       text,
  lat            numeric,
  lng            numeric,
  distance_m     double precision
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    id, bizes_id, bizes_nm, brch_nm,
    inds_lcls_nm, inds_mcls_nm, inds_scls_nm,
    category_group, rdnm_adr, lat, lng,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM nearby_shops
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND lat BETWEEN p_lat - 0.05 AND p_lat + 0.05
    AND lng BETWEEN p_lng - 0.07 AND p_lng + 0.07
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
    AND (p_category IS NULL OR category_group = p_category)
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_shops TO anon, authenticated;
