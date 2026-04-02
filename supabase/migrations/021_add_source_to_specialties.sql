-- 농촌진흥청 지역특산물 데이터 연동을 위한 특산물 테이블 확장
ALTER TABLE specialties
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'seed',
  ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
