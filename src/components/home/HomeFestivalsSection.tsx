import Link from "next/link"
import Image from "next/image"
import { CalendarDays, MapPin, ArrowRight } from "lucide-react"
import type { FestivalItem } from "@/types/festival"
import { computeStatus, getRegionName } from "@/lib/data/festivals"

function formatDate(d: string) {
  if (!d || d.length !== 8) return d
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`
}

const STATUS_LABEL: Record<string, string> = {
  ongoing: "진행 중",
  upcoming: "예정",
  unknown: "미정",
}
const STATUS_COLOR: Record<string, string> = {
  ongoing: "bg-emerald-50 text-emerald-700",
  upcoming: "bg-blue-50 text-blue-600",
  unknown: "bg-gray-50 text-gray-500",
}

export default function HomeFestivalsSection({
  festivals,
  locale,
}: {
  festivals: FestivalItem[]
  locale: string
}) {
  if (festivals.length === 0) return null

  return (
    <section className="bg-[#FFFDF5] py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">축제</p>
            <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">이번에 가볼 만한 축제</h2>
            <p className="mt-1 text-sm text-gray-500">진행 중이거나 곧 열리는 축제를 모아봤어요.</p>
          </div>
          <Link
            href={`/${locale}/events`}
            className="hidden items-center gap-1 text-sm font-medium text-[#D84315] hover:underline sm:flex"
          >
            전체 보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {festivals.map((f) => {
            const status = computeStatus(f)
            const region = getRegionName(f.areaCode)
            return (
              <Link
                key={f.contentId}
                href={`/${locale}/events/${f.contentId}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-md"
              >
                <div className="relative h-36 w-full bg-[#F4F1E9]">
                  {f.imageUrl ? (
                    <Image
                      src={f.imageUrl}
                      alt={f.title}
                      fill
                      className="object-cover"
                      sizes="300px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🎊</div>
                  )}
                  {status !== "ended" && (
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="mb-2 line-clamp-2 font-semibold leading-snug text-[#1B1C1A]">{f.title}</p>
                  <div className="mt-auto space-y-1 text-xs text-gray-400">
                    {region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {region}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(f.eventStartDate)} ~ {formatDate(f.eventEndDate)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href={`/${locale}/events`}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#D84315] hover:underline"
          >
            축제 전체 보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
