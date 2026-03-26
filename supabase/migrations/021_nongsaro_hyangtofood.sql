-- 농사로 향토음식 테이블
create table if not exists public.nongsaro_hyangtofood (
  id            uuid primary key default gen_random_uuid(),
  cntnts_no     text not null unique,          -- 콘텐츠 번호 (API cntntsNo)
  food_name     text not null,                 -- 음식명 (fdNm)
  sido_name     text,                          -- 시도명 (sidoNm)
  summary       text,                          -- 요약 설명
  description   text,                          -- 상세 설명
  image_url     text,                          -- 이미지 URL
  ingredients   text,                          -- 재료
  recipe        text,                          -- 조리법
  food_type     text,                          -- 음식 유형 분류 (food_type_ctg01)
  cooking_method text,                         -- 조리법 분류 (ck_ry_ctg01)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger set_nongsaro_hyangtofood_updated_at
  before update on public.nongsaro_hyangtofood
  for each row execute function public.set_updated_at();

create index if not exists nongsaro_hyangtofood_sido_idx on public.nongsaro_hyangtofood(sido_name);
create index if not exists nongsaro_hyangtofood_food_type_idx on public.nongsaro_hyangtofood(food_type);

alter table public.nongsaro_hyangtofood enable row level security;
create policy "Anyone can read nongsaro_hyangtofood"
  on public.nongsaro_hyangtofood for select using (true);
