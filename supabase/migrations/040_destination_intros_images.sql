-- PR1: TourAPI detailIntro2 / detailImage2 결과를 endpoint별 마스터로 분리
-- 출처: 공공데이터포털 KorService2 (areaBasedList2 row 기준)

-- 1) destination_intros (1:1) — detailIntro2 결과
create table if not exists public.destination_intros (
  content_id      text primary key references public.destinations(content_id) on delete cascade,
  content_type_id text not null,
  common_fields   jsonb,
  extras          jsonb,
  synced_at       timestamptz not null default now()
);

alter table public.destination_intros enable row level security;
create policy "Anyone can read destination_intros"
  on public.destination_intros for select using (true);

-- 2) destination_images (1:N) — detailImage2 결과 (한 destination당 row N개)
create table if not exists public.destination_images (
  id          bigserial primary key,
  content_id  text not null references public.destinations(content_id) on delete cascade,
  origin_url  text not null,
  image_name  text,
  serial_num  int,
  synced_at   timestamptz not null default now()
);

create index if not exists destination_images_content_id_idx
  on public.destination_images(content_id, serial_num);

alter table public.destination_images enable row level security;
create policy "Anyone can read destination_images"
  on public.destination_images for select using (true);
