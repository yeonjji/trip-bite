// P1-03: TourAPI contentTypeId 상수

export interface ContentType {
  id: string;
  nameKo: string;
  nameEn: string;
}

export const CONTENT_TYPES: ContentType[] = [
  { id: "12", nameKo: "관광지",       nameEn: "Tourist Attraction" },
  { id: "14", nameKo: "문화시설",     nameEn: "Cultural Facility" },
  { id: "15", nameKo: "축제/공연/행사", nameEn: "Festival/Event" },
  { id: "25", nameKo: "여행코스",     nameEn: "Travel Course" },
  { id: "28", nameKo: "레포츠",       nameEn: "Leisure/Sports" },
  { id: "32", nameKo: "숙박",         nameEn: "Accommodation" },
  { id: "38", nameKo: "쇼핑",         nameEn: "Shopping" },
  { id: "39", nameKo: "음식점",       nameEn: "Restaurant" },
];

export const CONTENT_TYPE_MAP = Object.fromEntries(
  CONTENT_TYPES.map((c) => [c.id, c])
);

// 여행지 탭에서 사용하는 테마 필터 (관광지, 문화시설, 레포츠 등)
export const TRAVEL_CONTENT_TYPES = CONTENT_TYPES.filter((c) =>
  ["12", "14", "28"].includes(c.id)
);

// 맛집 contentTypeId
export const RESTAURANT_CONTENT_TYPE_ID = "39";

// 여행지 기본 contentTypeId
export const TRAVEL_CONTENT_TYPE_ID = "12";
