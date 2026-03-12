-- P5-08: Row Level Security 정책

-- destinations: 읽기 공개, 쓰기 없음 (Edge Function만)
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "destinations_select_public"
  ON destinations FOR SELECT TO anon, authenticated
  USING (true);

-- camping_sites: 읽기 공개
ALTER TABLE camping_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camping_sites_select_public"
  ON camping_sites FOR SELECT TO anon, authenticated
  USING (true);

-- specialties: 읽기 공개
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialties_select_public"
  ON specialties FOR SELECT TO anon, authenticated
  USING (true);

-- recipes: 읽기 공개
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_select_public"
  ON recipes FOR SELECT TO anon, authenticated
  USING (true);

-- regions: 읽기 공개
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regions_select_public"
  ON regions FOR SELECT TO anon, authenticated
  USING (true);

-- weather_cache: 읽기 공개, 서비스 롤만 쓰기
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weather_cache_select_public"
  ON weather_cache FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "weather_cache_upsert_service"
  ON weather_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- accessibility_info: 읽기 공개
ALTER TABLE accessibility_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accessibility_info_select_public"
  ON accessibility_info FOR SELECT TO anon, authenticated
  USING (true);

-- reviews: 읽기 공개, 인증 사용자만 쓰기 (본인 것만 수정/삭제)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "reviews_insert_authenticated"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own"
  ON reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own"
  ON reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
