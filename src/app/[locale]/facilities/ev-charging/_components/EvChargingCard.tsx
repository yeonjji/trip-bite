import Link from "next/link";
import { Zap, MapPin, ChevronRight } from "lucide-react";
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
    <Link
      href={`/${locale}/facilities/ev-charging/${station.statId}`}
      className="block bg-white rounded-xl p-4 md:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-3 md:gap-6">
        {/* 아이콘 */}
        <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 bg-[#F9F7F0] rounded-xl flex items-center justify-center text-primary">
          <Zap className="w-5 h-5 md:w-7 md:h-7" />
        </div>

        {/* 중앙 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-semibold text-sm md:text-base text-gray-900 line-clamp-1">
              {station.statNm}
            </span>
            {station.hasFast && (
              <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 tracking-tight uppercase">
                {isKo ? "급속" : "Fast"}
              </span>
            )}
            {station.hasSlow && (
              <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 tracking-tight uppercase">
                {isKo ? "완속" : "Slow"}
              </span>
            )}
            {station.parkingFree === "Y" && (
              <span className="hidden md:inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 tracking-tight uppercase">
                {isKo ? "주차무료" : "Free Parking"}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-4">
            <span className="flex items-center gap-1 min-w-0 text-xs md:text-sm text-slate-500">
              <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-teal-600" />
              <span className="truncate">{station.addr}</span>
            </span>
            {station.maxOutput > 0 && (
              <span className="flex items-center gap-0.5 shrink-0 text-xs font-bold text-orange-700">
                <Zap className="w-3 h-3 text-orange-600" />
                {station.maxOutput}kW
              </span>
            )}
            {distance !== undefined && (
              <span className="shrink-0 text-slate-400 text-xs">{formatDistance(distance)}</span>
            )}
          </div>
        </div>

        {/* 충전기 수 */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <div className="text-center min-w-[40px] md:min-w-[72px]">
            <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {isKo ? "충전기" : "Chargers"}
            </p>
            <p className="text-base md:text-2xl font-bold text-teal-600 leading-none">
              {station.chargerCount}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
