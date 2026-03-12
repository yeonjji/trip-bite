-- P4-01: 날씨 캐시 테이블
create table if not exists public.weather_cache (
  id            uuid primary key default gen_random_uuid(),
  area_code     text not null unique,
  nx            integer not null,
  ny            integer not null,
  forecast_data jsonb not null default '{}',
  cached_at     timestamptz not null default now(),
  expires_at    timestamptz not null
);

-- RLS 활성화
alter table public.weather_cache enable row level security;

-- select 전체 허용
create policy "weather_cache_select_all"
  on public.weather_cache
  for select
  using (true);

-- 인덱스
create index if not exists weather_cache_area_code_idx on public.weather_cache (area_code);
create index if not exists weather_cache_expires_at_idx on public.weather_cache (expires_at);
