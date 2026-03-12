-- P1-10: camping_sites 테이블 마이그레이션 (PostGIS)

create table if not exists public.camping_sites (
  id               uuid primary key default gen_random_uuid(),
  content_id       text not null unique,
  faclt_nm         text not null,
  line_intro       text,
  do_nm            text not null,
  sigungu_nm       text not null,
  addr1            text not null,
  addr2            text,
  location         geography(point, 4326),  -- PostGIS
  mapx             numeric(11, 7),
  mapy             numeric(10, 7),
  tel              text,
  homepage         text,
  first_image_url  text,
  induty           text,        -- 업종 (일반야영장, 자동차야영장, 글램핑, 카라반)
  sbrs_cl          text,        -- 부대시설
  animal_cmg_cl    text,        -- 반려동물 동반 가능 여부
  brazier_cl       text,        -- 화로대 여부
  site_bottom_cl1  smallint,    -- 잔디
  site_bottom_cl2  smallint,    -- 파쇄석
  site_bottom_cl3  smallint,    -- 데크
  site_bottom_cl4  smallint,    -- 자갈
  site_bottom_cl5  smallint,    -- 맨흙
  gnrl_site_co     int,
  auto_site_co     int,
  glamp_site_co    int,
  carav_site_co    int,
  rating_avg       numeric(3, 1) not null default 0,
  rating_count     int not null default 0,
  cached_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger set_camping_sites_updated_at
  before update on public.camping_sites
  for each row execute function public.set_updated_at();

-- 인덱스
create index if not exists camping_sites_do_nm_idx on public.camping_sites(do_nm);
create index if not exists camping_sites_induty_idx on public.camping_sites(induty);
create index if not exists camping_sites_location_idx on public.camping_sites using gist(location);
create index if not exists camping_sites_rating_idx on public.camping_sites(rating_avg desc);

-- RLS
alter table public.camping_sites enable row level security;
create policy "Anyone can read camping_sites"
  on public.camping_sites for select using (true);
