import Image from "next/image"
import Link from "next/link"
import { MapPin } from "lucide-react"

import { getAreaName } from "@/lib/constants/area-codes"
import { TourSpotBase } from "@/types/tour-api"

interface TravelCardProps {
  item: TourSpotBase
  locale: string
  detailPath?: string
}

export default function TravelCard({ item, locale, detailPath }: TravelCardProps) {
  const { contentid, title, addr1, areacode, firstimage } = item
  const areaName = getAreaName(areacode)
  const href = detailPath ?? `/${locale}/travel/${contentid}`

  return (
    <Link href={href} className="group flex items-center gap-4 px-4 py-3.5 hover:bg-stone-50 transition-colors duration-200">
      {/* 썸네일 */}
      <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-stone-100">
        {firstimage ? (
          <Image
            src={firstimage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="72px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="w-6 h-6 text-stone-300" />
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-medium uppercase tracking-wide text-primary">{areaName}</span>
        <h3 className="mt-0.5 line-clamp-1 font-semibold text-foreground">{title}</h3>
        {addr1 && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{addr1}</p>
        )}
      </div>
    </Link>
  )
}
