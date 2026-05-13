import Link from "next/link"
import { ChevronRight, MapPin, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketItem } from "@/types/market"

interface Props {
  item: MarketItem
  locale: string
}

export default function MarketCard({ item, locale }: Props) {
  const { mktId, mktNm, rdnAdr, sidoNm, sggNm, mktTpNm, parkingYn, storNumber } = item
  const isKo = locale === "ko"

  return (
    <Link href={`/${locale}/markets/${mktId}`} className="group block">
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
          <Store className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          {(sidoNm || mktTpNm) && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
              {[sidoNm, mktTpNm].filter(Boolean).join(" · ")}
            </p>
          )}
          <h3 className="font-bold text-[16px] leading-snug line-clamp-1 text-foreground mt-0.5">
            {mktNm}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {(rdnAdr || sggNm) && (
              <p className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {rdnAdr ?? sggNm}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {storNumber && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                {isKo ? `점포 ${storNumber}개` : `${storNumber} stores`}
              </span>
            )}
            {parkingYn === "Y" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                {isKo ? "주차 가능" : "Parking"}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
