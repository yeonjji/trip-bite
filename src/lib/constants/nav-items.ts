import {
  MapPin,
  Calendar,
  Tent,
  UtensilsCrossed,
  ChefHat,
  Car,
  Landmark,
  Zap,
  Wifi,
  type LucideIcon,
} from "lucide-react"

export interface NavSubItem {
  labelKo: string
  labelEn: string
  descKo: string
  descEn: string
  href: string
  icon: LucideIcon
}

export interface NavItem {
  labelKo: string
  labelEn: string
  href: string
  children: NavSubItem[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    labelKo: "여행",
    labelEn: "Travel",
    href: "/travel",
    children: [
      {
        labelKo: "여행지",
        labelEn: "Destinations",
        descKo: "국내 인기 여행지를 둘러보세요",
        descEn: "Explore popular destinations",
        href: "/travel",
        icon: MapPin,
      },
      {
        labelKo: "축제",
        labelEn: "Festivals",
        descKo: "전국 축제와 문화행사 정보",
        descEn: "Festivals & cultural events",
        href: "/events",
        icon: Calendar,
      },
      {
        labelKo: "캠핑",
        labelEn: "Camping",
        descKo: "자연 속 캠핑지를 찾아보세요",
        descEn: "Find camping sites in nature",
        href: "/camping",
        icon: Tent,
      },
    ],
  },
  {
    labelKo: "먹거리",
    labelEn: "Food",
    href: "/restaurants",
    children: [
      {
        labelKo: "맛집",
        labelEn: "Restaurants",
        descKo: "맛있는 식당과 카페를 발견하세요",
        descEn: "Find great restaurants & cafes",
        href: "/restaurants",
        icon: UtensilsCrossed,
      },
      {
        labelKo: "레시피",
        labelEn: "Recipes",
        descKo: "다양한 한국 요리를 만나보세요",
        descEn: "Explore Korean recipes",
        href: "/recipes",
        icon: ChefHat,
      },
    ],
  },
  {
    labelKo: "편의",
    labelEn: "Facilities",
    href: "/facilities",
    children: [
      {
        labelKo: "주차장",
        labelEn: "Parking",
        descKo: "전국 공영 주차장 정보",
        descEn: "Public parking nationwide",
        href: "/facilities/parking",
        icon: Car,
      },
      {
        labelKo: "화장실",
        labelEn: "Restrooms",
        descKo: "가까운 공중화장실 찾기",
        descEn: "Find nearby restrooms",
        href: "/facilities/restrooms",
        icon: Landmark,
      },
      {
        labelKo: "충전소",
        labelEn: "EV Charging",
        descKo: "전기차 충전소 위치 안내",
        descEn: "EV charging stations",
        href: "/facilities/ev-charging",
        icon: Zap,
      },
      {
        labelKo: "와이파이",
        labelEn: "WiFi",
        descKo: "무료 공용 와이파이 찾기",
        descEn: "Find free public WiFi",
        href: "/facilities/wifi",
        icon: Wifi,
      },
    ],
  },
]
