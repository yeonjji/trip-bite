-- P2-02: recipes 테이블 마이그레이션

create table if not exists public.recipes (
  id                 uuid primary key default gen_random_uuid(),
  rcp_seq            text not null unique,
  name               text not null,
  cooking_method     text,
  category           text,
  main_image_url     text,
  finished_image_url text,
  ingredients        text,
  steps              jsonb not null default '[]',
  nutrition          jsonb not null default '{}',
  hash_tags          text[] not null default '{}',
  specialty_id       uuid references public.specialties(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger set_recipes_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- 인덱스
create index if not exists recipes_specialty_id_idx on public.recipes(specialty_id);
create index if not exists recipes_category_idx on public.recipes(category);
create index if not exists recipes_hash_tags_gin_idx on public.recipes using gin(hash_tags);

-- RLS
alter table public.recipes enable row level security;
create policy "Anyone can read recipes"
  on public.recipes for select using (true);
