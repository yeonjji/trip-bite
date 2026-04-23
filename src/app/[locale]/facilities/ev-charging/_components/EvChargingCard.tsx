import Link from "next/link";
import { Zap, MapPin } from "lucide-react";
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
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-stone-200 bg-white transition-all duration-150 hover:shadow-md hover:border-stone-300">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center border border-[#14b8a6]/20">
        <Zap className="w-5 h-5 text-[#0d9488]" />
      </div>

      {/* 중앙 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-sm text-gray-900 line-clamp-1">
            {station.statNm}
          </span>
          {station.hasFast && (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 tracking-wide uppercase">
              {isKo ? "급속" : "Fast"}
            </span>
          )}
          {station.hasSlow && (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 tracking-wide uppercase">
              {isKo ? "완속" : "Slow"}
            </span>
          )}
          {station.parkingFree === "Y" && (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 tracking-wide uppercase">
              {isKo ? "주차무료" : "Free Parking"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 line-clamp-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {station.addr}
          </span>
          {station.maxOutput > 0 && (
            <span className="flex items-center gap-0.5 shrink-0 font-semibold text-[#0d9488]">
              <Zap className="w-3 h-3" />
              {station.maxOutput}kW
            </span>
          )}
          {distance !== undefined && (
            <span className="shrink-0">{formatDistance(distance)}</span>
          )}
        </div>
      </div>

      {/* 충전기 수 */}
      <div className="flex-shrink-0 text-center min-w-[64px]">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
          {isKo ? "충전기" : "Chargers"}
        </p>
        <p className="text-xl font-bold text-[#0d9488] leading-none">
          {station.chargerCount}
        </p>
      </div>

      {/* View Details 버튼 */}
      <Link
        href={`/${locale}/facilities/ev-charging/${station.statId}`}
        className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#7c2d12] text-white text-xs font-bold hover:bg-[#6b2410] transition-colors"
      >
        {isKo ? "상세보기" : "View Details"}
      </Link>
    </div>
  );
}
