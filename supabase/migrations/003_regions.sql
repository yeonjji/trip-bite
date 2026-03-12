-- P1-08: regions 테이블 마이그레이션 + 17개 시도 시드

create table if not exists public.regions (
  id        uuid primary key default gen_random_uuid(),
  area_code text not null unique,
  name_ko   text not null,
  name_en   text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.regions enable row level security;
create policy "Anyone can read regions"
  on public.regions for select using (true);

-- 17개 시도 시드
insert into public.regions (area_code, name_ko, name_en) values
  ('1',  '서울',  'Seoul'),
  ('2',  '인천',  'Incheon'),
  ('3',  '대전',  'Daejeon'),
  ('4',  '대구',  'Daegu'),
  ('5',  '광주',  'Gwangju'),
  ('6',  '부산',  'Busan'),
  ('7',  '울산',  'Ulsan'),
  ('8',  '세종',  'Sejong'),
  ('31', '경기',  'Gyeonggi'),
  ('32', '강원',  'Gangwon'),
  ('33', '충북',  'Chungbuk'),
  ('34', '충남',  'Chungnam'),
  ('35', '전북',  'Jeonbuk'),
  ('36', '전남',  'Jeonnam'),
  ('37', '경북',  'Gyeongbuk'),
  ('38', '경남',  'Gyeongnam'),
  ('39', '제주',  'Jeju')
on conflict (area_code) do nothing;
