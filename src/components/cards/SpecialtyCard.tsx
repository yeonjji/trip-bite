// P2-06: 특산품 카드 컴포넌트

import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { SpecialtyRow } from "@/types/database"

interface SpecialtyCardProps {
  item: SpecialtyRow
  locale?: string
  regionName?: string
}

export default function SpecialtyCard({ item, locale = "ko", regionName }: SpecialtyCardProps) {
  const { id, name_ko, name_en, image_url, category, season } = item
  const displayName = locale === "en" && name_en ? name_en : name_ko

  return (
    <Link href={`/${locale}/specialties/${id}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {image_url ? (
            <Image
              src={image_url}
              alt={displayName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">{locale === "ko" ? "이미지 없음" : "No image"}</span>
            </div>
          )}
        </div>
        <CardContent className="pt-3">
          <h3 className="line-clamp-1 font-medium text-foreground">{displayName}</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="secondary">{category}</Badge>
            {season.map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
          {regionName && (
            <span className="mt-2 inline-block text-xs text-primary">{regionName}</span>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
