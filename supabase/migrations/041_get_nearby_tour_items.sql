-- PR1: 좌표 주변 destinations를 content_type별로 거리 순 반환하는 RPC
-- NearbyTourSection이 호출 (이전 tourApi.locationBasedList ×3 대체)

create or replace function public.get_nearby_tour_items(
  p_lat numeric,
  p_lng numeric,
  p_exclude text default null,
  p_types text[] default array['12','15','32'],
  radius_meters int default 15000,
  result_limit int default 6
)
returns table (
  content_id text,
  content_type_id text,
  title text,
  addr1 text,
  first_image text,
  lat numeric,
  lng numeric,
  distance_km numeric
)
language sql stable
set search_path = public, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng::float8, p_lat::float8), 4326)::geography g
  )
  select
    d.content_id,
    d.content_type_id,
    d.title,
    d.addr1,
    d.first_image,
    d.mapy as lat,
    d.mapx as lng,
    round((st_distance(d.location, origin.g) / 1000)::numeric, 1) as distance_km
  from public.destinations d, origin
  where d.content_type_id = any(p_types)
    and d.location is not null
    and st_dwithin(d.location, origin.g, radius_meters)
    and (p_exclude is null or d.content_id <> p_exclude)
    and d.first_image is not null
  order by d.location <-> origin.g
  limit result_limit;
$$;

grant execute on function public.get_nearby_tour_items(numeric, numeric, text, text[], int, int)
  to anon, authenticated;
