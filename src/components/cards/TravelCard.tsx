import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { getAreaName } from "@/lib/constants/area-codes"
import { TourSpotBase } from "@/types/tour-api"

const PET_CL_SHORT: Record<string, string> = {
  "1": "실내",
  "2": "야외",
  "3": "실내외",
}

interface TravelCardProps {
  item: TourSpotBase
  locale: string
  /** 기본값: /${locale}/travel/${contentid} */
  detailPath?: string
  petInfo?: { cl?: string } | null
}

export default function TravelCard({ item, locale, detailPath, petInfo }: TravelCardProps) {
  const { contentid, title, addr1, areacode, firstimage } = item
  const areaName = getAreaName(areacode)
  const href = detailPath ?? `/${locale}/travel/${contentid}`

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-5 p-5 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        {firstimage && (
          <div className="relative w-[80px] h-[80px] flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
            <Image
              src={firstimage}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary/80">{areaName}</p>
          <h3 className="font-bold text-[17px] leading-snug line-clamp-1 text-foreground mt-0.5">{title}</h3>
          {addr1 && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{addr1}</p>
          )}
          {petInfo && (
            <p className="mt-1 text-[11px] text-amber-700 font-medium">
              🐾 반려동물 동반{petInfo.cl && PET_CL_SHORT[petInfo.cl] ? ` · ${PET_CL_SHORT[petInfo.cl]} 가능` : " 가능"}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
