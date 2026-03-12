-- P2-01: specialties 테이블 마이그레이션

create table if not exists public.specialties (
  id          uuid primary key default gen_random_uuid(),
  name_ko     text not null,
  name_en     text,
  region_id   uuid not null references public.regions(id) on delete cascade,
  category    text not null check (category in ('농산물','수산물','축산물','가공식품','공예품','기타')),
  season      text[] not null default '{}',
  description text,
  image_url   text,
  tags        text[],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger set_specialties_updated_at
  before update on public.specialties
  for each row execute function public.set_updated_at();

-- 인덱스
create index if not exists specialties_region_id_idx on public.specialties(region_id);
create index if not exists specialties_category_idx on public.specialties(category);

-- RLS
alter table public.specialties enable row level security;
create policy "Anyone can read specialties"
  on public.specialties for select using (true);
