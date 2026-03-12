-- KorService2 지역 코드로 업데이트
-- 기존 데이터 삭제 후 새 코드로 재삽입

delete from public.regions;

insert into public.regions (area_code, name_ko, name_en) values
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
on conflict (area_code) do nothing;
