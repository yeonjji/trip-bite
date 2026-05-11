-- 공공 와이파이 표준데이터

create table if not exists public.free_wifi (
  id              uuid primary key default gen_random_uuid(),
  manage_no       text not null unique,          -- 관리번호
  place_name      text not null default '',      -- 설치장소명
  place_detail    text,                          -- 설치장소상세
  sido_name       text,                          -- 설치시도명
  sigungu_name    text,                          -- 설치시군구명
  facility_type   text,                          -- 설치시설구분명
  provider        text,                          -- 서비스제공사명
  ssid            text,                          -- 와이파이SSID
  address_road    text,                          -- 소재지도로명주소
  address_jibun   text,                          -- 소재지지번주소
  lat             numeric(11, 7),                -- WGS84위도
  lng             numeric(11, 7),                -- WGS84경도
  area_code       text,                          -- 법정동 시도 코드
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists free_wifi_area_code_idx   on public.free_wifi(area_code);
create index if not exists free_wifi_sido_name_idx   on public.free_wifi(sido_name);
create index if not exists free_wifi_location_idx    on public.free_wifi(lat, lng);

alter table public.free_wifi enable row level security;
drop policy if exists "Anyone can read free_wifi" on public.free_wifi;
create policy "Anyone can read free_wifi"
  on public.free_wifi for select using (true);
