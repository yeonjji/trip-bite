-- Migration 018: regions 테이블 재구성 (시도 17개 재삽입)
-- 시군구 먼저 삭제 후 시도 재삽입
-- 시군구는 scripts/sync-sigungu-codes.mjs 로 별도 수집

-- 1) 시군구(자식) 먼저 삭제
DELETE FROM public.regions WHERE parent_area_code IS NOT NULL;
-- 2) 시도(부모) 삭제 — destinations 등 FK 참조가 있으므로 참조되지 않는 행만 삭제됨
--    이미 존재하는 시도는 ON CONFLICT DO NOTHING으로 유지

-- 17개 시도 재삽입 (destinations/pet_friendly_places/barrier_free_places FK 복원)
INSERT INTO public.regions (area_code, name_ko, name_en) VALUES
  ('11',    '서울',  'Seoul'),
  ('26',    '부산',  'Busan'),
  ('27',    '대구',  'Daegu'),
  ('28',    '인천',  'Incheon'),
  ('29',    '광주',  'Gwangju'),
  ('30',    '대전',  'Daejeon'),
  ('31',    '울산',  'Ulsan'),
  ('41',    '경기',  'Gyeonggi'),
  ('43',    '충북',  'Chungbuk'),
  ('44',    '충남',  'Chungnam'),
  ('46',    '전남',  'Jeonnam'),
  ('47',    '경북',  'Gyeongbuk'),
  ('48',    '경남',  'Gyeongnam'),
  ('50',    '제주',  'Jeju'),
  ('51',    '강원',  'Gangwon'),
  ('52',    '전북',  'Jeonbuk'),
  ('36110', '세종',  'Sejong')
ON CONFLICT (area_code) DO NOTHING;
