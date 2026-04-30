import Link from "next/link"
import { UtensilsCrossed, Tent, CalendarDays, ParkingSquare, Zap, ShieldCheck } from "lucide-react"

interface TravelType {
  icon: React.ElementType
  title: string
  desc: string
  href: string
}

const TYPES: TravelType[] = [
  {
    icon: UtensilsCrossed,
    title: "맛집 중심 여행",
    desc: "전국 맛집을 지역별로 탐색",
    href: "/restaurants",
  },
  {
    icon: Tent,
    title: "캠핑 여행",
    desc: "야영장·글램핑·카라반 한눈에",
    href: "/camping",
  },
  {
    icon: CalendarDays,
    title: "축제 여행",
    desc: "지금 열리는 축제 모아보기",
    href: "/events?status=ongoing",
  },
  {
    icon: ParkingSquare,
    title: "주차 편한 여행",
    desc: "공영주차장 위치 확인",
    href: "/facilities/parking",
  },
  {
    icon: Zap,
    title: "전기차 여행",
    desc: "전기차 충전소 지도로 탐색",
    href: "/facilities/ev-charging",
  },
  {
    icon: ShieldCheck,
    title: "편의시설 걱정 없는 여행",
    desc: "화장실·와이파이·충전소 통합 확인",
    href: "/facilities",
  },
]

export default function TravelTypeSection({ locale }: { locale: string }) {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">여행 유형</p>
          <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">어떤 여행을 찾고 있나요?</h2>
          <p className="mt-1 text-sm text-gray-500">목적에 맞는 여행 정보를 빠르게 찾아보세요.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {TYPES.map(({ icon: Icon, title, desc, href }) => (
            <Link
              key={title}
              href={`/${locale}${href}`}
              className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-[#FAFAF8] p-5 transition-all hover:border-[#D84315]/30 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EF] text-[#D84315] transition-colors group-hover:bg-[#D84315] group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-[#1B1C1A]">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
