import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { CampingSiteBase, CampingSiteDetail } from "@/types/camping"

interface CampingCardProps {
  item: CampingSiteBase | CampingSiteDetail
  locale: string
}

export default function CampingCard({ item, locale }: CampingCardProps) {
  const { contentId, facltNm, doNm, sigunguNm, firstImageUrl } = item
  const induty = "induty" in item ? item.induty : undefined

  return (
    <Link href={`/${locale}/camping/${contentId}`} className="group block">
      <div className="flex items-center gap-5 p-5 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        {firstImageUrl && (
          <div className="relative w-[80px] h-[80px] flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
            <Image
              src={firstImageUrl}
              alt={facltNm}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {(doNm || induty) && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary/80">
              {[doNm, induty].filter(Boolean).join(" · ")}
            </p>
          )}
          <h3 className="font-bold text-[17px] leading-snug line-clamp-1 text-foreground mt-0.5">{facltNm}</h3>
          {sigunguNm && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{sigunguNm}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
