SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION get_nearby_traditional_markets(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 5000,
  result_limit  int     DEFAULT 5
)
RETURNS TABLE (
  id          bigint,
  mkt_id      text,
  mkt_nm      text,
  rdn_adr     text,
  lat         numeric,
  lng         numeric,
  mkt_tp_nm   text,
  parking_yn  text,
  tel_no      text,
  distance_m  double precision
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    id, mkt_id, mkt_nm, rdn_adr, lat, lng,
    mkt_tp_nm, parking_yn, tel_no,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM traditional_markets
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND lat BETWEEN p_lat - 0.15 AND p_lat + 0.15
    AND lng BETWEEN p_lng - 0.2  AND p_lng + 0.2
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_traditional_markets TO anon, authenticated;
