import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import ImagePlaceholder from "@/components/shared/ImagePlaceholder"
import { CampingSiteBase, CampingSiteDetail } from "@/types/camping"

interface CampingCardProps {
  item: CampingSiteBase | CampingSiteDetail
  locale: string
}

export default function CampingCard({ item, locale }: CampingCardProps) {
  const { contentId, facltNm, doNm, sigunguNm, firstImageUrl } = item
  const induty = "induty" in item ? item.induty : undefined

  return (
    <Link href={`/${locale}/camping/${contentId}`} className="block group">
      <Card className="h-full cursor-pointer border-0 bg-white soft-card-shadow hover:warm-shadow transition-all duration-300 pt-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {firstImageUrl ? (
            <Image
              src={firstImageUrl}
              alt={facltNm}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <ImagePlaceholder type="camping" alt={facltNm} />
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
