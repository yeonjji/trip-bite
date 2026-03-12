-- P3-01: accessibility_info 테이블 마이그레이션

create table if not exists public.accessibility_info (
  id             uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  -- 반려동물
  pet_possible   boolean,
  pet_size_range text,
  pet_fee        text,
  pet_count      text,
  pet_info       text,
  -- 휠체어/장애인
  wheelchair     boolean,
  -- 외국인
  foreign_friendly boolean,
  -- 기타
  raw_data       jsonb,
  cached_at      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger set_accessibility_info_updated_at
  before update on public.accessibility_info
  for each row execute function public.set_updated_at();

-- 인덱스
create index if not exists accessibility_info_destination_id_idx
  on public.accessibility_info(destination_id);

-- RLS
alter table public.accessibility_info enable row level security;
create policy "Anyone can read accessibility_info"
  on public.accessibility_info for select using (true);
