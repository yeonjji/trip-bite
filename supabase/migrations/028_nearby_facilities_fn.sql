-- 주변 편의시설 조회 함수 (PostGIS, 인라인 포인트 생성)
-- bbox 사전 필터 → ST_DWithin 정밀 필터 → 거리 정렬

-- ─────────────────────────────────────────
-- 1) 주변 공중화장실
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_nearby_public_toilets(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 2000,
  result_limit  int     DEFAULT 5
)
RETURNS TABLE (
  id             uuid,
  name           text,
  address_road   text,
  address_jibun  text,
  lat            numeric,
  lng            numeric,
  baby_care      boolean,
  cctv           boolean,
  emergency_bell boolean,
  open_time      text,
  manage_org     text,
  phone          text,
  distance_m     double precision
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    id, name, address_road, address_jibun, lat, lng,
    baby_care, cctv, emergency_bell, open_time, manage_org, phone,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM public_toilets
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND lat BETWEEN p_lat - 0.1  AND p_lat + 0.1
    AND lng BETWEEN p_lng - 0.15 AND p_lng + 0.15
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_public_toilets TO anon, authenticated;

-- ─────────────────────────────────────────
-- 2) 주변 공공 와이파이
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_nearby_free_wifi(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 2000,
  result_limit  int     DEFAULT 5
)
RETURNS TABLE (
  id             uuid,
  place_name     text,
  place_detail   text,
  facility_type  text,
  provider       text,
  ssid           text,
  address_road   text,
  address_jibun  text,
  lat            numeric,
  lng            numeric,
  distance_m     double precision
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    id, place_name, place_detail, facility_type, provider, ssid,
    address_road, address_jibun, lat, lng,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM free_wifi
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND lat BETWEEN p_lat - 0.1  AND p_lat + 0.1
    AND lng BETWEEN p_lng - 0.15 AND p_lng + 0.15
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_free_wifi TO anon, authenticated;

-- ─────────────────────────────────────────
-- 3) 주변 주차장
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_nearby_parking(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 2000,
  result_limit  int     DEFAULT 5
)
RETURNS TABLE (
  id             uuid,
  name           text,
  type           text,
  address_road   text,
  address_jibun  text,
  lat            numeric,
  lng            numeric,
  capacity       int,
  fee_type       text,
  base_fee       int,
  weekday_open   text,
  weekday_close  text,
  disabled_spots int,
  phone          text,
  distance_m     double precision
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    id, name, type, address_road, address_jibun, lat, lng,
    capacity, fee_type, base_fee,
    weekday_open, weekday_close, disabled_spots, phone,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM parking_lots
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND lat BETWEEN p_lat - 0.1  AND p_lat + 0.1
    AND lng BETWEEN p_lng - 0.15 AND p_lng + 0.15
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_parking TO anon, authenticated;

-- ─────────────────────────────────────────
-- 4) 주변 전기차 충전소 (ev_stations 뷰 기반)
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_nearby_ev_stations(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 2000,
  result_limit  int     DEFAULT 5
)
RETURNS TABLE (
  stat_id       text,
  stat_nm       text,
  addr          text,
  lat           numeric,
  lng           numeric,
  busi_nm       text,
  use_time      text,
  parking_free  text,
  charger_count bigint,
  has_fast      boolean,
  has_slow      boolean,
  max_output    numeric,
  distance_m    double precision
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    stat_id, stat_nm, addr, lat, lng,
    busi_nm, use_time, parking_free,
    charger_count, has_fast, has_slow, max_output,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM ev_stations
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND lat BETWEEN p_lat - 0.1  AND p_lat + 0.1
    AND lng BETWEEN p_lng - 0.15 AND p_lng + 0.15
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_ev_stations TO anon, authenticated;
