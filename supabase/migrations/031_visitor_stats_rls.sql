-- visitor_stats 테이블 공개 읽기 권한 설정
alter table public.visitor_stats_metro enable row level security;
create policy "Anyone can read visitor_stats_metro"
  on public.visitor_stats_metro for select using (true);

alter table public.visitor_stats_local enable row level security;
create policy "Anyone can read visitor_stats_local"
  on public.visitor_stats_local for select using (true);
