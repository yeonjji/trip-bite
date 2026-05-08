-- 관광빅데이터 방문자수 집계 테이블 (DataLabService)
-- 이동통신 데이터 기반, 일 1회 갱신

-- 광역 지자체별 방문자수 (시도 단위)
create table if not exists visitor_stats_metro (
  id           bigserial primary key,
  area_code    text        not null,  -- 시도코드 (법정동 코드: 11, 26, ...)
  area_nm      text        not null,  -- 시도명
  base_ymd     date        not null,  -- 기준연월일
  daywk_div_cd text        not null,  -- 요일구분코드 (1:월~7:일)
  daywk_div_nm text        not null,  -- 요일구분명
  tou_div_cd   text        not null,  -- 관광객구분코드 (1:현지인, 2:외지인, 3:외국인)
  tou_div_nm   text        not null,  -- 관광객구분명
  tou_num      numeric     not null,  -- 관광객수
  synced_at    timestamptz not null default now(),
  unique (area_code, base_ymd, tou_div_cd)
);

create index if not exists visitor_stats_metro_area_code_idx on visitor_stats_metro (area_code);
create index if not exists visitor_stats_metro_base_ymd_idx  on visitor_stats_metro (base_ymd);
create index if not exists visitor_stats_metro_tou_div_idx   on visitor_stats_metro (tou_div_cd);

-- 기초 지자체별 방문자수 (시군구 단위)
create table if not exists visitor_stats_local (
  id           bigserial primary key,
  signgu_code  text        not null,  -- 시군구코드 (5자리 법정동 코드: 11110, ...)
  signgu_nm    text        not null,  -- 시군구명
  base_ymd     date        not null,  -- 기준연월일
  daywk_div_cd text        not null,  -- 요일구분코드
  daywk_div_nm text        not null,  -- 요일구분명
  tou_div_cd   text        not null,  -- 관광객구분코드
  tou_div_nm   text        not null,  -- 관광객구분명
  tou_num      numeric     not null,  -- 관광객수
  synced_at    timestamptz not null default now(),
  unique (signgu_code, base_ymd, tou_div_cd)
);

create index if not exists visitor_stats_local_signgu_code_idx on visitor_stats_local (signgu_code);
create index if not exists visitor_stats_local_base_ymd_idx    on visitor_stats_local (base_ymd);
create index if not exists visitor_stats_local_tou_div_idx     on visitor_stats_local (tou_div_cd);
