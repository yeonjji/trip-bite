-- 농사로 이달의 음식 테이블
create table if not exists public.nongsaro_monthly_foods (
  id           uuid primary key default gen_random_uuid(),
  cntnts_no    text not null unique,          -- 콘텐츠 번호 (API cntntsNo)
  food_name    text not null,                 -- 음식명 (foodNm)
  month        int not null,                  -- 월 1~12 (sMonth)
  category     text,                          -- 분류 (fldGroupNm: 식재료/김치/수산물)
  summary      text,                          -- 요약 설명
  description  text,                          -- 상세 설명
  thumbnail_url text,                         -- 썸네일 이미지 URL
  image_url    text,                          -- 대표 이미지 URL
  ingredients  text,                          -- 재료
  recipe       text,                          -- 레시피 내용
  nutrition    jsonb not null default '{}',   -- 영양정보
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger set_nongsaro_monthly_updated_at
  before update on public.nongsaro_monthly_foods
  for each row execute function public.set_updated_at();

create index if not exists nongsaro_monthly_month_idx on public.nongsaro_monthly_foods(month);
create index if not exists nongsaro_monthly_category_idx on public.nongsaro_monthly_foods(category);

alter table public.nongsaro_monthly_foods enable row level security;
create policy "Anyone can read nongsaro_monthly_foods"
  on public.nongsaro_monthly_foods for select using (true);


-- 농사로 지역특산물 향토음식 테이블
create table if not exists public.nongsaro_local_foods (
  id           uuid primary key default gen_random_uuid(),
  cntnts_no    text not null unique,          -- 콘텐츠 번호 (API cntntsNo)
  food_name    text not null,                 -- 음식명 (foodNm)
  sido_name    text,                          -- 시도명 (sidoNm)
  sigun_name   text,                          -- 시군구명 (sigunNm)
  summary      text,                          -- 요약 (foodSumry)
  description  text,                          -- 상세 (foodDtl)
  image_url    text,                          -- 이미지 URL
  ingredients  text,                          -- 재료 (ingrdCn)
  recipe       text,                          -- 레시피 (rcipeCn)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger set_nongsaro_local_updated_at
  before update on public.nongsaro_local_foods
  for each row execute function public.set_updated_at();

create index if not exists nongsaro_local_sido_idx on public.nongsaro_local_foods(sido_name);
create index if not exists nongsaro_local_sigun_idx on public.nongsaro_local_foods(sigun_name);

alter table public.nongsaro_local_foods enable row level security;
create policy "Anyone can read nongsaro_local_foods"
  on public.nongsaro_local_foods for select using (true);
