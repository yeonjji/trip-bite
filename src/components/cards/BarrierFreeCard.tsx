import Image from "next/image"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { getAreaName } from "@/lib/constants/area-codes"
import type { BarrierFreePlace } from "@/types/barrier-free"

const ACCESSIBILITY_FIELDS: (keyof BarrierFreePlace)[] = [
  "wheelchair",
  "exit_accessible",
  "restroom_wh",
  "elevator",
  "parking_wh",
  "braileblock",
  "signguide",
  "audioguide",
]

const ACCESSIBILITY_ICONS: Partial<Record<keyof BarrierFreePlace, string>> = {
  wheelchair: "♿",
  exit_accessible: "🚪",
  restroom_wh: "🚻",
  elevator: "🛗",
  parking_wh: "🅿️",
  braileblock: "⠿",
  signguide: "📋",
  audioguide: "🔊",
}

interface BarrierFreeCardProps {
  item: BarrierFreePlace
  locale: string
}

export default function BarrierFreeCard({ item, locale }: BarrierFreeCardProps) {
  const { content_id, title, addr1, area_code, first_image } = item
  const areaName = getAreaName(area_code)

  const availableCount = ACCESSIBILITY_FIELDS.filter((f) => item[f]).length

  return (
    <Link href={`/${locale}/travel/barrier-free/${content_id}`} className="block group">
      <Card className="h-full cursor-pointer border-0 bg-white soft-card-shadow hover:warm-shadow transition-all duration-300">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {first_image ? (
            <Image
              src={first_image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">이미지 없음</span>
            </div>
          )}
          {availableCount > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
              ♿ {availableCount}/{ACCESSIBILITY_FIELDS.length}
            </span>
          )}
        </div>
        <CardContent className="pt-3">
          <h3 className="line-clamp-1 font-medium text-foreground">{title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{addr1}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-primary">{areaName}</span>
            <div className="flex gap-0.5 text-sm">
              {ACCESSIBILITY_FIELDS.slice(0, 5).map((f) => (
                <span
                  key={f as string}
                  className={item[f] ? "opacity-100" : "opacity-20"}
                  title={f as string}
                >
                  {ACCESSIBILITY_ICONS[f]}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
