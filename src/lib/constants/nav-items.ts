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
      { labelKo: "캠핑", labelEn: "Camping", href: "/camping" },
      { labelKo: "무장애 여행", labelEn: "Barrier-Free", href: "/travel/barrier-free" },
      { labelKo: "반려동물 여행", labelEn: "Pet-Friendly", href: "/travel/pet" },
    ],
  },
  { labelKo: "맛집", labelEn: "Restaurants", href: "/restaurants" },
  { labelKo: "특산품", labelEn: "Specialties", href: "/specialties" },
]
