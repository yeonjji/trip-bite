export interface PetFriendlyPlace {
  id: string;
  content_id: string;
  title: string;
  addr1: string;
  addr2?: string;
  area_code: string;
  sigungu_code?: string;
  mapx?: number;
  mapy?: number;
  first_image?: string;
  first_image2?: string;
  tel?: string;
  homepage?: string;
  overview?: string;
  // 반려동물 전용 필드
  pet_acmpny_cl?: string;   // 동반 가능 구분 (실내/실외/실내외)
  rel_pet_info?: string;    // 반려동물 관련 정보
  acmpny_type_cd?: string;  // 동반 가능 동물 종류
  rating_avg: number;
  rating_count: number;
  cached_at?: string;
  created_at: string;
  updated_at: string;
}
