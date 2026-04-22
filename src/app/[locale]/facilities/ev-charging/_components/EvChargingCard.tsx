import Link from "next/link";
import { Zap } from "lucide-react";
import { formatDistance } from "@/lib/utils/haversine";
import type { EvStationSummary } from "@/lib/data/ev-charging";

interface EvChargingCardProps {
  station: EvStationSummary;
  locale: string;
  distance?: number;
}

export default function EvChargingCard({ station, locale, distance }: EvChargingCardProps) {
  const isKo = locale === "ko";

  return (
    <Link href={`/${locale}/facilities/ev-charging/${station.statId}`} className="block">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white transition-all duration-150 hover:shadow-sm hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/[0.02] group">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#14b8a6]/10 flex items-center justify-center border-l-2 border-[#14b8a6]">
          <Zap className="w-4.5 h-4.5 text-[#0d9488]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {station.hasFast && (
              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700">
                {isKo ? "급속" : "Fast"}
              </span>
            )}
            {station.hasSlow && (
              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                {isKo ? "완속" : "Slow"}
              </span>
            )}
            {station.parkingFree === "Y" && (
              <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-green-100 text-green-700">
                {isKo ? "주차무료" : "Free Parking"}
              </span>
            )}
          </div>
          <p className="font-semibold text-sm leading-snug line-clamp-1 text-gray-900 group-hover:text-[#0d9488] transition-colors">
            {station.statNm}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{station.addr}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-[#0d9488]">
            {isKo ? `${station.chargerCount}대` : `${station.chargerCount} ch`}
          </p>
          {station.maxOutput > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {isKo ? `최대 ${station.maxOutput}kW` : `up to ${station.maxOutput}kW`}
            </p>
          )}
          {distance !== undefined && (
            <p className="text-[11px] text-muted-foreground">{formatDistance(distance)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
