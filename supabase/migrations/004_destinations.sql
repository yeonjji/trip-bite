-- P1-09: destinations 테이블 마이그레이션 (PostGIS, GIST 인덱스)

create table if not exists public.destinations (
  id              uuid primary key default gen_random_uuid(),
  content_id      text not null unique,
  content_type_id text not null,
  title           text not null,
  addr1           text not null default '',
  addr2           text,
  area_code       text references public.regions(area_code),
  sigungu_code    text,
  location        geography(point, 4326),  -- PostGIS
  mapx            numeric(11, 7),
  mapy            numeric(10, 7),
  first_image     text,
  first_image2    text,
  tel             text,
  homepage        text,
  overview        text,
  rating_avg      numeric(3, 1) not null default 0,
  rating_count    int not null default 0,
  cached_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger set_destinations_updated_at
  before update on public.destinations
  for each row execute function public.set_updated_at();

-- 인덱스
create index if not exists destinations_area_code_idx on public.destinations(area_code);
create index if not exists destinations_content_type_idx on public.destinations(content_type_id);
create index if not exists destinations_location_idx on public.destinations using gist(location);
create index if not exists destinations_rating_idx on public.destinations(rating_avg desc);

-- RLS
alter table public.destinations enable row level security;
create policy "Anyone can read destinations"
  on public.destinations for select using (true);
