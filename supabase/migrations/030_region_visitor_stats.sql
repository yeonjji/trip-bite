-- 관광빅데이터 DataLabService 기반 지역별 방문자 통계

create table if not exists public.region_visitor_stats (
  id            uuid primary key default gen_random_uuid(),
  area_code     text not null,   -- 광역시도 코드 (법정동: "11","26",...)
  sigungu_code  text,            -- 시군구 코드 (null이면 광역 단위 집계)
  base_ym       text not null,   -- 기준 연월 YYYYMM
  visitor_count bigint,          -- 방문자 수 (순방문자, KT 이동통신 기반)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (area_code, sigungu_code, base_ym)
);

create index if not exists region_visitor_stats_area_ym_idx
  on public.region_visitor_stats (area_code, base_ym);

create index if not exists region_visitor_stats_sigungu_ym_idx
  on public.region_visitor_stats (sigungu_code, base_ym)
  where sigungu_code is not null;

create trigger set_region_visitor_stats_updated_at
  before update on public.region_visitor_stats
  for each row execute function public.set_updated_at();

alter table public.region_visitor_stats enable row level security;
create policy "Anyone can read region_visitor_stats"
  on public.region_visitor_stats for select using (true);
