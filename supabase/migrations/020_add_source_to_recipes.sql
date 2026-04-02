-- 농촌진흥청 향토음식 데이터 연동을 위한 레시피 테이블 확장
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT '식약처',
  ADD COLUMN IF NOT EXISTS rural_food_id TEXT UNIQUE;
