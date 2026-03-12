-- P4-19: pg_cron 자동 동기화 스케줄 설정
-- 전제: pg_cron, pg_net 확장이 활성화되어 있어야 합니다.
-- Supabase Dashboard > Database > Extensions 에서 활성화하세요.

-- 기존 스케줄 제거 (재실행 안전)
select cron.unschedule('sync-destinations') where exists (
  select 1 from cron.job where jobname = 'sync-destinations'
);
select cron.unschedule('sync-camping') where exists (
  select 1 from cron.job where jobname = 'sync-camping'
);
select cron.unschedule('sync-recipes') where exists (
  select 1 from cron.job where jobname = 'sync-recipes'
);
select cron.unschedule('sync-accessibility') where exists (
  select 1 from cron.job where jobname = 'sync-accessibility'
);
select cron.unschedule('sync-weather') where exists (
  select 1 from cron.job where jobname = 'sync-weather'
);

-- 여행지 동기화: 매일 새벽 2시
select cron.schedule(
  'sync-destinations',
  '0 2 * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-destinations',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 캠핑장 동기화: 매일 새벽 3시
select cron.schedule(
  'sync-camping',
  '0 3 * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-camping',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 레시피 동기화: 매주 월요일 새벽 4시
select cron.schedule(
  'sync-recipes',
  '0 4 * * 1',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-recipes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 접근성 정보 동기화: 매주 화요일 새벽 4시
select cron.schedule(
  'sync-accessibility',
  '0 4 * * 2',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-accessibility',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 날씨 캐시 갱신: 매시간 0분
select cron.schedule(
  'sync-weather',
  '0 * * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-weather',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    );
  $$
);
