-- Phase 1: 반려동물 동반여행 테이블

create table if not exists public.pet_friendly_places (
  id              uuid primary key default gen_random_uuid(),
  content_id      text not null unique,
  title           text not null,
  addr1           text not null default '',
  addr2           text,
  area_code       text references public.regions(area_code),
  sigungu_code    text,
  location        geography(point, 4326),
  mapx            numeric(11, 7),
  mapy            numeric(10, 7),
  first_image     text,
  first_image2    text,
  tel             text,
  homepage        text,
  overview        text,
  -- 반려동물 전용 필드
  pet_acmpny_cl   text,   -- 동반 가능 구분 (실내/실외/실내외)
  rel_pet_info    text,   -- 반려동물 관련 정보
  acmpny_type_cd  text,   -- 동반 가능 동물 종류
  rating_avg      numeric(3,1) not null default 0,
  rating_count    int not null default 0,
  cached_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger set_pet_friendly_places_updated_at
  before update on public.pet_friendly_places
  for each row execute function public.set_updated_at();

create index if not exists pet_friendly_places_area_code_idx on public.pet_friendly_places(area_code);
create index if not exists pet_friendly_places_rating_idx on public.pet_friendly_places(rating_avg desc);
create index if not exists pet_friendly_places_location_idx on public.pet_friendly_places using gist(location);

alter table public.pet_friendly_places enable row level security;
create policy "Anyone can read pet_friendly_places"
  on public.pet_friendly_places for select using (true);
