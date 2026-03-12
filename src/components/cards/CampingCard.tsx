import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CampingSiteBase, CampingSiteDetail } from "@/types/camping"

interface CampingCardProps {
  item: CampingSiteBase | CampingSiteDetail
  locale: string
}

export default function CampingCard({ item, locale }: CampingCardProps) {
  const { contentId, facltNm, doNm, sigunguNm, firstImageUrl } = item
  const induty = "induty" in item ? item.induty : undefined

  return (
    <Link href={`/${locale}/camping/${contentId}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {firstImageUrl ? (
            <Image
              src={firstImageUrl}
              alt={facltNm}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">이미지 없음</span>
            </div>
          )}
        </div>
        <CardContent className="pt-3">
          <h3 className="line-clamp-1 font-medium text-foreground">{facltNm}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {doNm} {sigunguNm}
          </p>
          {induty && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {induty}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
