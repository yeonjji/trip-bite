-- 공중화장실 표준데이터

create table if not exists public.public_toilets (
  id              uuid primary key default gen_random_uuid(),
  manage_no       text not null unique,          -- 관리번호
  name            text not null default '',      -- 화장실명
  address_road    text not null default '',      -- 소재지도로명주소
  address_jibun   text not null default '',      -- 소재지지번주소
  lat             numeric(11, 7),                -- WGS84위도
  lng             numeric(11, 7),                -- WGS84경도
  area_code       text,                          -- 법정동 시도 코드
  manage_org      text,                          -- 관리기관명
  phone           text,                          -- 전화번호
  open_time       text,                          -- 개방시간
  open_time_detail text,                         -- 개방시간상세
  male_toilets    int,                           -- 남성용 대변기수
  female_toilets  int,                           -- 여성용 대변기수
  disabled_male   int,                           -- 남성용 장애인 대변기수
  disabled_female int,                           -- 여성용 장애인 대변기수
  baby_care       boolean not null default false,-- 기저귀교환대유무
  cctv            boolean not null default false,-- 화장실입구CCTV설치유무
  emergency_bell  boolean not null default false,-- 비상벨설치여부
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists public_toilets_area_code_idx on public.public_toilets(area_code);
create index if not exists public_toilets_location_idx  on public.public_toilets(lat, lng);

alter table public.public_toilets enable row level security;
create policy "Anyone can read public_toilets"
  on public.public_toilets for select using (true);
