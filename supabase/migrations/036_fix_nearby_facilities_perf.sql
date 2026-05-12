SET search_path = public, extensions;

-- 1) ev_chargers 좌표 인덱스 추가 (뷰 집계 전 bbox 필터용)
CREATE INDEX IF NOT EXISTS ev_chargers_lat_lng_idx
  ON ev_chargers (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 2) get_nearby_public_toilets: bbox를 radius에 비례하도록 수정
CREATE OR REPLACE FUNCTION get_nearby_public_toilets(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 3000,
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
    AND lat BETWEEN p_lat - (radius_meters::double precision / 111000)
                AND p_lat + (radius_meters::double precision / 111000)
    AND lng BETWEEN p_lng - (radius_meters::double precision / 88000)
                AND p_lng + (radius_meters::double precision / 88000)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_public_toilets TO anon, authenticated;

-- 3) get_nearby_free_wifi: bbox를 radius에 비례하도록 수정
CREATE OR REPLACE FUNCTION get_nearby_free_wifi(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 3000,
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
    AND lat BETWEEN p_lat - (radius_meters::double precision / 111000)
                AND p_lat + (radius_meters::double precision / 111000)
    AND lng BETWEEN p_lng - (radius_meters::double precision / 88000)
                AND p_lng + (radius_meters::double precision / 88000)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_free_wifi TO anon, authenticated;

-- 4) get_nearby_parking: bbox를 radius에 비례하도록 수정
CREATE OR REPLACE FUNCTION get_nearby_parking(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 3000,
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
    AND lat BETWEEN p_lat - (radius_meters::double precision / 111000)
                AND p_lat + (radius_meters::double precision / 111000)
    AND lng BETWEEN p_lng - (radius_meters::double precision / 88000)
                AND p_lng + (radius_meters::double precision / 88000)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_parking TO anon, authenticated;

-- 5) get_nearby_ev_stations: ev_chargers 선필터 후 집계 (핵심 수정)
CREATE OR REPLACE FUNCTION get_nearby_ev_stations(
  p_lat         double precision,
  p_lng         double precision,
  radius_meters int     DEFAULT 3000,
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
  WITH bbox_chargers AS (
    SELECT stat_id, stat_nm, addr, lat, lng, busi_nm, use_time, parking_free, output
    FROM ev_chargers
    WHERE del_yn IS DISTINCT FROM 'Y'
      AND lat IS NOT NULL AND lng IS NOT NULL
      AND lat BETWEEN p_lat - (radius_meters::double precision / 111000)
                  AND p_lat + (radius_meters::double precision / 111000)
      AND lng BETWEEN p_lng - (radius_meters::double precision / 88000)
                  AND p_lng + (radius_meters::double precision / 88000)
  ),
  aggregated AS (
    SELECT
      stat_id,
      max(stat_nm)                                               AS stat_nm,
      max(addr)                                                  AS addr,
      avg(lat)::numeric                                          AS lat,
      avg(lng)::numeric                                          AS lng,
      max(busi_nm)                                               AS busi_nm,
      max(use_time)                                              AS use_time,
      max(parking_free)                                          AS parking_free,
      count(*)                                                   AS charger_count,
      bool_or(NULLIF(output,'')::numeric > 22)                  AS has_fast,
      bool_or(NULLIF(output,'') IS NOT NULL
              AND NULLIF(output,'')::numeric <= 22)              AS has_slow,
      max(NULLIF(output,'')::numeric)                           AS max_output
    FROM bbox_chargers
    GROUP BY stat_id
  )
  SELECT
    stat_id, stat_nm, addr, lat, lng, busi_nm, use_time, parking_free,
    charger_count, has_fast, has_slow, max_output,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM aggregated
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_m
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_ev_stations TO anon, authenticated;
