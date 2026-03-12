// P1-05: 특산품 타입

export type SpecialtyCategory =
  | "농산물"
  | "수산물"
  | "축산물"
  | "가공식품"
  | "공예품"
  | "기타";

export type Season = "봄" | "여름" | "가을" | "겨울" | "연중";

export interface Specialty {
  id: string;
  nameKo: string;
  nameEn?: string;
  regionId: string;        // regions 테이블 FK
  category: SpecialtyCategory;
  season: Season[];        // 제철 시즌 (복수 가능)
  description?: string;
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SpecialtyWithRegion extends Specialty {
  region: {
    nameKo: string;
    nameEn: string;
    areaCode: string;
  };
}
