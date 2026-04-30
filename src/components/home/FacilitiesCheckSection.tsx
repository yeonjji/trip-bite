import Link from "next/link"
import { ParkingSquare, Toilet, Wifi, Zap } from "lucide-react"

const ITEMS = [
  {
    icon: ParkingSquare,
    label: "주차장",
    desc: "공영·무료 주차장 찾기",
    href: "/facilities/parking",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    icon: Toilet,
    label: "공공화장실",
    desc: "가까운 화장실 위치 확인",
    href: "/facilities/restrooms",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Wifi,
    label: "무료 와이파이",
    desc: "공공 와이파이 존 찾기",
    href: "/facilities/wifi",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Zap,
    label: "전기차 충전소",
    desc: "전기차 충전기 위치 탐색",
    href: "/facilities/ev-charging",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
]

export default function FacilitiesCheckSection({ locale }: { locale: string }) {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">편의시설</p>
          <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">여행 전 체크하세요</h2>
          <p className="mt-1 text-sm text-gray-500">주차장, 화장실, 와이파이, 충전소를 미리 확인하세요.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ITEMS.map(({ icon: Icon, label, desc, href, color, bg }) => (
            <Link
              key={label}
              href={`/${locale}${href}`}
              className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-[#FAFAF8] p-6 text-center transition-all hover:border-gray-200 hover:shadow-sm"
            >
              <span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${color} transition-transform group-hover:scale-110`}>
                <Icon className="h-6 w-6" />
              </span>
              <p className="font-semibold text-[#1B1C1A]">{label}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
