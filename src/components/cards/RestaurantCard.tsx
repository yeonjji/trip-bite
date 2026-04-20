import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { getAreaName } from "@/lib/constants/area-codes"
import { RestaurantDetail } from "@/types/tour-api"

interface RestaurantCardProps {
  item: RestaurantDetail
  locale: string
}

export default function RestaurantCard({ item, locale }: RestaurantCardProps) {
  const { contentid, title, addr1, areacode, firstimage, firstmenu } = item
  const areaName = getAreaName(areacode)

  return (
    <Link href={`/${locale}/restaurants/${contentid}`} className="group block">
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
          {firstmenu ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{firstmenu}</p>
          ) : addr1 ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{addr1}</p>
          ) : null}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
