import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { getAreaName } from "@/lib/constants/area-codes"
import { TourSpotBase } from "@/types/tour-api"

interface TravelCardProps {
  item: TourSpotBase
  locale: string
  /** 기본값: /${locale}/travel/${contentid} */
  detailPath?: string
}

export default function TravelCard({ item, locale, detailPath }: TravelCardProps) {
  const { contentid, title, addr1, areacode, firstimage } = item
  const areaName = getAreaName(areacode)
  const href = detailPath ?? `/${locale}/travel/${contentid}`

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        {firstimage && (
          <div className="relative w-[60px] h-[60px] flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
            <Image
              src={firstimage}
              alt={title}
              fill
              className="object-cover"
              sizes="60px"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary/80">{areaName}</p>
          <h3 className="font-bold text-[15px] leading-snug line-clamp-1 text-foreground">{title}</h3>
          {addr1 && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{addr1}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
