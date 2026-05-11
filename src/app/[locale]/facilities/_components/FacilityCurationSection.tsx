import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FACILITY_CARDS = [
  {
    emoji: "🅿️",
    tag: "주차장",
    title: "장거리 여행 전\n미리 확인하는 주차 정보",
    desc: "여행지 도착 전 주차 공간을 미리 파악해두면 훨씬 여유로운 여행이 시작됩니다.",
    href: "parking",
    bg: "bg-[#F7F3ED]",
  },
  {
    emoji: "📶",
    tag: "공공 와이파이",
    title: "어디서든 연결되는\n무료 공공 와이파이",
    desc: "전국 주요 여행지의 무료 와이파이 위치를 미리 확인하고 데이터 걱정 없이 여행하세요.",
    href: "wifi",
    bg: "bg-[#F2F6F4]",
  },
  {
    emoji: "⚡",
    tag: "전기차 충전소",
    title: "전기차 여행자를 위한\n전국 충전 포인트",
    desc: "캠핑장, 휴게소, 관광지 인근 전기차 충전소를 한눈에 파악하세요.",
    href: "ev-charging",
    bg: "bg-[#F3F3F7]",
  },
  {
    emoji: "🚻",
    tag: "공중화장실",
    title: "여행 중 언제든\n이용 가능한 화장실",
    desc: "관광지·공원·해변 근처 공중화장실 위치를 미리 확인해두면 여행이 더 편안해집니다.",
    href: "restrooms",
    bg: "bg-[#F6F4F0]",
  },
];

const REGIONAL_LINKS = [
  { area: "서울", type: "주차장",       href: "parking",     areaCode: "11" },
  { area: "부산", type: "공공 와이파이",  href: "wifi",        areaCode: "26" },
  { area: "제주", type: "전기차 충전소",  href: "ev-charging", areaCode: "50" },
  { area: "강원", type: "공중화장실",    href: "restrooms",   areaCode: "42" },
  { area: "경기", type: "주차장",       href: "parking",     areaCode: "41" },
  { area: "인천", type: "공공 와이파이",  href: "wifi",        areaCode: "28" },
  { area: "대구", type: "전기차 충전소",  href: "ev-charging", areaCode: "27" },
  { area: "전남", type: "공중화장실",    href: "restrooms",   areaCode: "46" },
];

interface Props {
  locale: string;
}

export default function FacilityCurationSection({ locale }: Props) {
  return (
    <div className="mt-10 space-y-12">
      {/* 여행 중 필요한 순간 */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#D84315]">
            여행 편의 가이드
          </p>
          <h2 className="mt-1 font-headline text-lg font-bold text-[#1B1C1A]">
            여행 중 필요한 순간
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            여행자를 위한 편의시설 정보를 미리 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FACILITY_CARDS.map((card) => (
            <Link
              key={card.href}
              href={`/${locale}/facilities/${card.href}`}
              className={`group rounded-2xl ${card.bg} p-5 transition-shadow hover:shadow-md`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-2xl leading-none">{card.emoji}</span>
                <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-[#5A413A]">
                  {card.tag}
                </span>
              </div>
              <p className="whitespace-pre-line text-sm font-bold leading-snug text-[#1B1C1A]">
                {card.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#7A6A62]">{card.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#D84315] opacity-0 transition-opacity group-hover:opacity-100">
                둘러보기 <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 지역별 편의시설 둘러보기 */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#D84315]">
            지역별 탐색
          </p>
          <h2 className="mt-1 font-headline text-lg font-bold text-[#1B1C1A]">
            지역별 편의시설 둘러보기
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            여행지 지역의 편의시설을 미리 파악해보세요
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {REGIONAL_LINKS.map((link) => (
            <Link
              key={`${link.area}-${link.href}`}
              href={`/${locale}/facilities/${link.href}?areaCode=${link.areaCode}`}
              className="group flex flex-col rounded-xl border border-[#EDE9E0] bg-white px-4 py-3.5 transition-colors hover:border-[#D84315]/30 hover:bg-[#FFF8F5]"
            >
              <span className="text-xs font-semibold text-[#D84315]">{link.area}</span>
              <span className="mt-0.5 text-sm font-medium text-[#1B1C1A] leading-snug">
                {link.type}
              </span>
              <ArrowRight className="mt-2 h-3.5 w-3.5 text-[#C4B5AD] transition-colors group-hover:text-[#D84315]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
