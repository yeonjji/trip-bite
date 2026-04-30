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
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {LINKS.map(({ icon: Icon, label, href }) => (
        <Link
          key={label}
          href={`/${locale}${href}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-[#5A413A] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#D84315] hover:text-white"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  )
}
