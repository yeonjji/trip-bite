import Image from "next/image"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
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
    <Link href={href} className="block group">
      <Card className="h-full cursor-pointer border-0 bg-white soft-card-shadow hover:warm-shadow transition-all duration-300 pt-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {firstimage ? (
            <Image
              src={firstimage}
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
        </div>
        <CardContent className="pt-3">
          <h3 className="line-clamp-1 font-medium text-foreground">{title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{addr1}</p>
          <span className="mt-2 inline-block text-xs text-primary">{areaName}</span>
        </CardContent>
      </Card>
    </Link>
  )
}
