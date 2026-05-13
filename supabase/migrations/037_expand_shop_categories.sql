SET search_path = public, extensions;

-- G20405(편의점)를 mart에서 convenience_store로 분리
UPDATE nearby_shops
SET category_group = 'convenience_store'
WHERE inds_scls_cd = 'G20405' AND category_group = 'mart';

-- RPC 함수는 category_group 텍스트 필터만 사용하므로 스키마 변경 불필요
-- 새 카테고리(medical, accommodation, entertainment)는 실시간 API 캐싱으로 자동 추가됨
