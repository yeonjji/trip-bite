import Image from "next/image"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { getAreaName } from "@/lib/constants/area-codes"
import type { PetFriendlyPlace } from "@/types/pet-friendly"

const PET_CL_MAP: Record<string, { ko: string; en: string; className: string }> = {
  "1": { ko: "실내", en: "Indoor", className: "bg-blue-100 text-blue-700" },
  "2": { ko: "실외", en: "Outdoor", className: "bg-green-100 text-green-700" },
  "3": { ko: "실내외", en: "Indoor & Outdoor", className: "bg-purple-100 text-purple-700" },
}

interface PetCardProps {
  item: PetFriendlyPlace
  locale: string
}

export default function PetCard({ item, locale }: PetCardProps) {
  const { content_id, title, addr1, area_code, first_image, pet_acmpny_cl, acmpny_type_cd } = item
  const areaName = getAreaName(area_code)
  const isKo = locale === "ko"
  const cl = pet_acmpny_cl ? PET_CL_MAP[pet_acmpny_cl] : null

  return (
    <Link href={`/${locale}/travel/pet/${content_id}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {first_image ? (
            <Image
              src={first_image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">이미지 없음</span>
            </div>
          )}
          {cl && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${cl.className}`}
            >
              {isKo ? cl.ko : cl.en}
            </span>
          )}
        </div>
        <CardContent className="pt-3">
          <h3 className="line-clamp-1 font-medium text-foreground">{title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{addr1}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-primary">{areaName}</span>
            {acmpny_type_cd && (
              <span className="shrink-0 truncate text-xs text-amber-600">
                🐾 {acmpny_type_cd.length > 12 ? acmpny_type_cd.slice(0, 12) + "…" : acmpny_type_cd}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
