-- Phase 2: 무장애 여행 테이블

create table if not exists public.barrier_free_places (
  id               uuid primary key default gen_random_uuid(),
  content_id       text not null unique,
  content_type_id  text,
  title            text not null,
  addr1            text not null default '',
  addr2            text,
  area_code        text references public.regions(area_code),
  sigungu_code     text,
  location         geography(point, 4326),
  mapx             numeric(11, 7),
  mapy             numeric(10, 7),
  first_image      text,
  first_image2     text,
  tel              text,
  homepage         text,
  overview         text,
  -- 무장애 전용 필드
  wheelchair       text,       -- 휠체어 대여
  exit_accessible  text,       -- 출입구 접근
  restroom_wh      text,       -- 장애인 화장실
  elevator         text,       -- 엘리베이터
  parking_wh       text,       -- 장애인 주차
  braileblock      text,       -- 점자블록
  signguide        text,       -- 점자 안내판
  audioguide       text,       -- 오디오 가이드
  rating_avg       numeric(3,1) not null default 0,
  rating_count     int not null default 0,
  cached_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger set_barrier_free_places_updated_at
  before update on public.barrier_free_places
  for each row execute function public.set_updated_at();

create index if not exists barrier_free_places_area_code_idx on public.barrier_free_places(area_code);
create index if not exists barrier_free_places_rating_idx on public.barrier_free_places(rating_avg desc);
create index if not exists barrier_free_places_location_idx on public.barrier_free_places using gist(location);

alter table public.barrier_free_places enable row level security;
create policy "Anyone can read barrier_free_places"
  on public.barrier_free_places for select using (true);
