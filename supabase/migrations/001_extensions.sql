-- P0-06: Supabase 확장 활성화
-- PostGIS: 지리정보(위경도) 저장 및 공간 쿼리
-- pg_cron: 정기 스케줄 작업 (API 동기화)
-- pg_net: Edge Function에서 HTTP 요청

create extension if not exists postgis with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
