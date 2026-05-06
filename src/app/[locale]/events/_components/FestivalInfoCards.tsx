import { MapPin, Clock, Ticket, Users, ShoppingCart, Tag, Star, Timer } from "lucide-react"

interface Props {
  isKo: boolean
  addr1?: string | null
  eventplace?: string | null
  playtime?: string | null
  eventprice?: string | null
  agelimit?: string | null
  bookingplace?: string | null
  discountinfofestival?: string | null
  festivalgrade?: string | null
  spendtimefestival?: string | null
}

interface InfoItem {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}

function clean(val: string | null | undefined): string | null {
  if (!val) return null
  const stripped = val.replace(/<[^>]+>/g, "").trim()
  return stripped || null
}

export default function FestivalInfoCards({
  isKo,
  addr1,
  eventplace,
  playtime,
  eventprice,
  agelimit,
  bookingplace,
  discountinfofestival,
  festivalgrade,
  spendtimefestival,
}: Props) {
  const venue = clean(eventplace) || clean(addr1)

  const items: InfoItem[] = [
    venue && {
      icon: <MapPin size={16} />,
      label: isKo ? "개최 장소" : "Venue",
      value: venue,
    },
    clean(playtime) && {
      icon: <Clock size={16} />,
      label: isKo ? "운영 시간" : "Hours",
      value: clean(playtime)!,
    },
    clean(eventprice) && {
      icon: <Ticket size={16} />,
      label: isKo ? "입장료" : "Admission",
      value: clean(eventprice)!,
      highlight: true,
    },
    clean(agelimit) && {
      icon: <Users size={16} />,
      label: isKo ? "이용 연령" : "Age Limit",
      value: clean(agelimit)!,
    },
    clean(spendtimefestival) && {
      icon: <Timer size={16} />,
      label: isKo ? "소요 시간" : "Duration",
      value: clean(spendtimefestival)!,
    },
    clean(discountinfofestival) && {
      icon: <Tag size={16} />,
      label: isKo ? "할인 정보" : "Discount",
      value: clean(discountinfofestival)!,
    },
    clean(bookingplace) && {
      icon: <ShoppingCart size={16} />,
      label: isKo ? "예매처" : "Booking",
      value: clean(bookingplace)!,
    },
    clean(festivalgrade) && {
      icon: <Star size={16} />,
      label: isKo ? "축제 등급" : "Grade",
      value: clean(festivalgrade)!,
    },
  ].filter(Boolean) as InfoItem[]

  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="mb-3 font-headline text-xl font-bold text-[#1B1C1A]">
        {isKo ? "축제 한눈에 보기" : "Festival Overview"}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex gap-3 rounded-xl p-3.5 ${
              item.highlight
                ? "bg-[#FFF3EF] ring-1 ring-[#D84315]/20"
                : "bg-[#F9F7EF] ring-1 ring-gray-100"
            }`}
          >
            <div
              className={`mt-0.5 shrink-0 ${
                item.highlight ? "text-[#D84315]" : "text-[#7B5E57]"
              }`}
            >
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className="break-words text-sm font-medium text-[#1B1C1A] leading-snug">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
