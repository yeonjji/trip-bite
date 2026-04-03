import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import ImagePlaceholder from "@/components/shared/ImagePlaceholder"
import { computeStatus, getRegionName } from "@/lib/data/festivals"
import type { FestivalItem } from "@/types/festival"

interface FestivalCardProps {
  item: FestivalItem
  locale: string
}

const STATUS_CONFIG = {
  ongoing: { ko: "진행중", en: "Ongoing", className: "bg-green-100 text-green-800" },
  upcoming: { ko: "예정", en: "Upcoming", className: "bg-blue-100 text-blue-800" },
  ended: { ko: "종료", en: "Ended", className: "bg-gray-100 text-gray-600" },
}

function formatDateRange(start: string, end: string, locale: string): string {
  if (!start || !end) return ""
  const fmt = (d: string) =>
    locale === "en"
      ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
      : `${d.slice(0, 4)}년 ${d.slice(4, 6)}월 ${d.slice(6, 8)}일`
  const startStr = fmt(start)
  const endStr =
    start.slice(0, 4) === end.slice(0, 4) && locale === "ko"
      ? `${end.slice(4, 6)}월 ${end.slice(6, 8)}일`
      : fmt(end)
  return locale === "en" ? `${startStr} – ${endStr}` : `${startStr} ~ ${endStr}`
}

export default function FestivalCard({ item, locale }: FestivalCardProps) {
  const { contentId, title, imageUrl, addr1, eventStartDate, eventEndDate, areaCode } = item
  const status = computeStatus(item)
  const region = getRegionName(areaCode)
  const statusCfg = STATUS_CONFIG[status]
  const isKo = locale === "ko"

  return (
    <Link href={`/${locale}/events/${contentId}`} className="block group">
      <Card className="h-full cursor-pointer border-0 bg-white soft-card-shadow hover:warm-shadow transition-all duration-300 pt-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <ImagePlaceholder type="festival" />
          )}
        </div>
        <CardContent className="pt-3 pb-4">
          <span
            className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}
          >
            {isKo ? statusCfg.ko : statusCfg.en}
          </span>
          <h3 className="line-clamp-1 font-medium text-foreground">{title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{addr1}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateRange(eventStartDate, eventEndDate, locale)}
          </p>
          {region && (
            <span className="mt-2 inline-block text-xs text-primary">{region}</span>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
