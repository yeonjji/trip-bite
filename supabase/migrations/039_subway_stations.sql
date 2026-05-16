-- Step 3b: 전국 지하철역 마스터 + 좌표 주변 검색 RPC
-- 출처: 공공데이터포털 "전국도시철도역사정보표준데이터" (CSV 일괄 적재)
-- 패턴: nearby_facilities (toilets/wifi/parking/ev) 동일

create table if not exists public.subway_stations (
  id              uuid primary key default gen_random_uuid(),
  station_id      text not null unique,
  station_name    text not null,
  line_name       text not null default '',
  road_address    text,
  jibun_address   text,
  lat             numeric(10, 7) not null,
  lng             numeric(11, 7) not null,
  location        geography(point, 4326),
  agency          text,
  phone           text,
  cached_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger set_subway_stations_updated_at
  before update on public.subway_stations
  for each row execute function public.set_updated_at();

create index if not exists subway_stations_station_id_idx on public.subway_stations(station_id);
create index if not exists subway_stations_location_idx on public.subway_stations using gist(location);

alter table public.subway_stations enable row level security;
create policy "Anyone can read subway_stations"
  on public.subway_stations for select using (true);

-- upsert 시 location 컬럼을 lat/lng로부터 자동 채우는 트리거
create or replace function public.subway_stations_set_location()
returns trigger language plpgsql as $$
begin
  new.location := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

drop trigger if exists subway_stations_set_location_trg on public.subway_stations;
create trigger subway_stations_set_location_trg
  before insert or update of lat, lng on public.subway_stations
  for each row execute function public.subway_stations_set_location();

-- 좌표 주변 N미터 이내 지하철역 (거리 순 정렬)
create or replace function public.get_nearby_subway(
  p_lat numeric,
  p_lng numeric,
  radius_meters int default 2000,
  result_limit int default 5
)
returns table (
  station_id text,
  station_name text,
  line_name text,
  road_address text,
  jibun_address text,
  lat numeric,
  lng numeric,
  distance_m int
)
language sql stable as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng::float8, p_lat::float8), 4326)::geography g
  )
  select
    s.station_id,
    s.station_name,
    s.line_name,
    s.road_address,
    s.jibun_address,
    s.lat,
    s.lng,
    st_distance(s.location, origin.g)::int as distance_m
  from public.subway_stations s, origin
  where st_dwithin(s.location, origin.g, radius_meters)
  order by s.location <-> origin.g
  limit result_limit;
$$;
