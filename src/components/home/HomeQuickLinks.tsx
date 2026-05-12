import Link from "next/link"
import { CalendarDays, Tent, ParkingSquare, Zap, UtensilsCrossed } from "lucide-react"

const LINKS = [
  { icon: CalendarDays, label: "이번 주 축제", href: "/events?status=ongoing" },
  { icon: Tent,         label: "캠핑장 찾기",  href: "/camping" },
  { icon: ParkingSquare,label: "주차장",       href: "/facilities/parking" },
  { icon: Zap,          label: "전기차 충전소", href: "/facilities/ev-charging" },
  { icon: UtensilsCrossed, label: "맛집 탐방", href: "/restaurants" },
]

export default function HomeQuickLinks({ locale }: { locale: string }) {
  return (
    <div className="mt-3 md:mt-6 flex flex-nowrap overflow-x-auto gap-1.5 md:flex-wrap md:justify-center md:gap-2 pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {LINKS.map(({ icon: Icon, label, href }) => (
        <Link
          key={label}
          href={`/${locale}${href}`}
          className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1 md:gap-1.5 rounded-full bg-white/90 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#5A413A] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#D84315] hover:text-white"
        >
          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
          {label}
        </Link>
      ))}
    </div>
  )
}
