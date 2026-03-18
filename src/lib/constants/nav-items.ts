// 메뉴 정의 중앙화: 헤더·모바일 네비게이션 모두 이 파일에서 가져옵니다.

export interface NavItem {
  labelKo: string
  labelEn: string
  href: string
}

export interface NavGroup {
  labelKo: string
  labelEn: string
  href?: string
  items?: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKo: "여행",
    labelEn: "Travel",
    items: [
      { labelKo: "전체 여행지", labelEn: "All Destinations", href: "/travel" },
      { labelKo: "무장애 여행", labelEn: "Barrier-Free", href: "/travel/barrier-free" },
      { labelKo: "반려동물 여행", labelEn: "Pet-Friendly", href: "/travel/pet" },
    ],
  },
  {
    labelKo: "캠핑",
    labelEn: "Camping",
    items: [
      { labelKo: "전체 캠핑", labelEn: "All Camping", href: "/camping" },
      { labelKo: "일반야영지", labelEn: "General Camping", href: "/camping/general" },
      { labelKo: "자동차야영지", labelEn: "Car Camping", href: "/camping/car" },
      { labelKo: "글램핑", labelEn: "Glamping", href: "/camping/glamping" },
      { labelKo: "카라반", labelEn: "Caravan", href: "/camping/caravan" },
    ],
  },
  { labelKo: "맛집", labelEn: "Restaurants", href: "/restaurants" },
  { labelKo: "레시피", labelEn: "Recipes", href: "/recipes" },
  { labelKo: "특산품", labelEn: "Specialties", href: "/specialties" },
]
