-- 한국천문연구원 일출몰 정보 테이블
create table if not exists rise_set_info (
  id           bigserial primary key,
  area_code    text        not null,  -- 법정동 시도코드 (11, 26, ...)
  area_nm      text        not null,  -- 지역명
  locdate      date        not null,  -- 기준일자
  sunrise      text,                  -- 일출시각 (HHMM)
  sunset       text,                  -- 일몰시각 (HHMM)
  moonrise     text,                  -- 월출시각 (HHMM)
  moonset      text,                  -- 월몰시각 (HHMM)
  sun_altitude text,                  -- 태양 남중 고도
  synced_at    timestamptz not null default now(),
  unique (area_code, locdate)
);

create index if not exists rise_set_info_area_code_idx on rise_set_info (area_code);
create index if not exists rise_set_info_locdate_idx   on rise_set_info (locdate);

-- 공개 읽기 허용
alter table rise_set_info enable row level security;
drop policy if exists "public read" on rise_set_info;
create policy "public read" on rise_set_info for select using (true);
