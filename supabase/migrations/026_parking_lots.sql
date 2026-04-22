-- 전국주차장정보표준데이터

create table if not exists public.parking_lots (
  id              uuid primary key default gen_random_uuid(),
  manage_no       text not null unique,
  name            text not null default '',
  type            text,                     -- 주차장 구분 (노상/노외/부설/기계식)
  address_jibun   text,
  address_road    text,
  lat             numeric(11, 7),
  lng             numeric(11, 7),
  capacity        int,                      -- 총 주차면수
  fee_type        text,                     -- 무료/유료
  base_fee        int,                      -- 기본 주차 요금 (원)
  weekday_open    text,                     -- HHmm
  weekday_close   text,
  sat_open        text,
  sat_close       text,
  holiday_open    text,
  holiday_close   text,
  disabled_spots  int,
  phone           text,
  area_code       text,
  sido_name       text,
  sigungu_name    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists parking_lots_area_code_idx on public.parking_lots(area_code);
create index if not exists parking_lots_fee_type_idx  on public.parking_lots(fee_type);
create index if not exists parking_lots_location_idx  on public.parking_lots(lat, lng);

alter table public.parking_lots enable row level security;
create policy "Anyone can read parking_lots"
  on public.parking_lots for select using (true);
