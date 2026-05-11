SET search_path = public, extensions;

-- 거리 기반 근처 맛집 조회 함수 (PostGIS)
CREATE OR REPLACE FUNCTION get_nearby_restaurants(
  lat  double precision,
  lng  double precision,
  radius_meters int     DEFAULT 5000,
  result_limit  int     DEFAULT 4,
  exclude_id    text    DEFAULT NULL
)
RETURNS SETOF destinations
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT *
  FROM destinations
  WHERE content_type_id = '39'
    AND location IS NOT NULL
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
    AND (exclude_id IS NULL OR content_id != exclude_id)
  ORDER BY ST_Distance(
    location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  )
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_restaurants TO anon, authenticated;
