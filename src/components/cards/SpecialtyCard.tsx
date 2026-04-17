import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import type { SpecialtyRow } from "@/types/database"

interface SpecialtyCardProps {
  item: SpecialtyRow
  locale?: string
  regionName?: string
}

export default function SpecialtyCard({ item, locale = "ko", regionName }: SpecialtyCardProps) {
  const { id, name_ko, name_en, image_url, category } = item
  const displayName = locale === "en" && name_en ? name_en : name_ko

  return (
    <Link href={`/${locale}/specialties/${id}`} className="group block">
      <div className="flex items-center gap-5 p-5 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        {image_url && (
          <div className="relative w-[80px] h-[80px] flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
            <Image
              src={image_url}
              alt={displayName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {regionName && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary/80">{regionName}</p>
          )}
          <h3 className="font-bold text-[17px] leading-snug line-clamp-1 text-foreground mt-0.5">{displayName}</h3>
          {category && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{category}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
