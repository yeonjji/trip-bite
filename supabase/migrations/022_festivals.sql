create table if not exists public.festivals (
  id               bigserial primary key,
  content_id       text unique not null,
  title            text not null,
  image_url        text,
  addr1            text,
  addr2            text,
  area_code        text,
  sigungu_code     text,
  mapx             numeric,
  mapy             numeric,
  event_start_date text,
  event_end_date   text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists festivals_area_code_idx        on public.festivals(area_code);
create index if not exists festivals_event_start_date_idx on public.festivals(event_start_date);
create index if not exists festivals_event_end_date_idx   on public.festivals(event_end_date);
