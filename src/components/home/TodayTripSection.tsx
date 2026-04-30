import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface Course {
  emoji: string
  title: string
  subtitle: string
  tags: string[]
  href: string
  bg: string
}

const COURSES: Course[] = [
  {
    emoji: "🌿",
    title: "반나절 가볍게",
    subtitle: "여행지 · 맛집 · 주차장까지 한번에",
    tags: ["#여행지", "#맛집", "#주차장"],
    href: "/travel",
    bg: "bg-[#FFF8F5]",
  },
  {
    emoji: "⛺",
    title: "캠핑 감성 코스",
    subtitle: "캠핑장부터 주변 관광지·편의시설까지",
    tags: ["#캠핑장", "#관광지", "#편의시설"],
    href: "/camping",
    bg: "bg-[#F5FAF5]",
  },
  {
    emoji: "🎊",
    title: "축제 따라가기",
    subtitle: "지금 열리는 축제 + 근처 맛집 탐방",
    tags: ["#축제", "#맛집", "#주차장"],
    href: "/events?status=ongoing",
    bg: "bg-[#FDFAF0]",
  },
]

export default function TodayTripSection({ locale }: { locale: string }) {
  return (
    <section className="bg-[#FFFDF5] py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">추천 코스</p>
          <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">오늘은 이렇게 떠나볼까요?</h2>
          <p className="mt-1 text-sm text-gray-500">Trip Bite가 엄선한 여행 코스를 만나보세요.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {COURSES.map((course) => (
            <Link
              key={course.title}
              href={`/${locale}${course.href}`}
              className={`group flex flex-col rounded-2xl p-6 ${course.bg} border border-gray-100 transition-shadow hover:shadow-md`}
            >
              <span className="mb-3 text-3xl">{course.emoji}</span>
              <p className="mb-1 font-headline text-lg font-bold text-[#1B1C1A]">{course.title}</p>
              <p className="mb-4 text-sm leading-relaxed text-gray-500">{course.subtitle}</p>
              <div className="mb-5 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs text-gray-500 border border-gray-100">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[#D84315] transition-gap group-hover:gap-2">
                탐색하기 <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
