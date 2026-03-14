import Image from "next/image"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
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
    <Link href={`/${locale}/restaurants/${contentid}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {firstimage ? (
            <Image
              src={firstimage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">이미지 없음</span>
            </div>
          )}
        </div>
        <CardContent className="pt-3">
          <h3 className="line-clamp-1 font-medium text-foreground">{title}</h3>
          {firstmenu && (
            <p className="mt-1 line-clamp-1 text-xs text-primary">{firstmenu}</p>
          )}
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{addr1}</p>
          <span className="mt-2 inline-block text-xs text-primary">{areaName}</span>
        </CardContent>
      </Card>
    </Link>
  )
}
