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
    <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-6">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-14 h-14 bg-[#F9F7F0] rounded-xl flex items-center justify-center text-primary">
        <Zap className="w-7 h-7" />
      </div>

      {/* 중앙 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="font-semibold text-base text-gray-900 line-clamp-1">
            {station.statNm}
          </span>
          {station.hasFast && (
            <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded bg-orange-100 text-orange-700 tracking-tight uppercase">
              {isKo ? "급속" : "Fast"}
            </span>
          )}
          {station.hasSlow && (
            <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded bg-sky-100 text-sky-700 tracking-tight uppercase">
              {isKo ? "완속" : "Slow"}
            </span>
          )}
          {station.parkingFree === "Y" && (
            <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 tracking-tight uppercase">
              {isKo ? "주차무료" : "Free Parking"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1 min-w-0 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-600" />
            {station.addr}
          </span>
          {station.maxOutput > 0 && (
            <span className="flex items-center gap-1 shrink-0 font-bold text-orange-700">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              {station.maxOutput}kW
            </span>
          )}
          {distance !== undefined && (
            <span className="shrink-0 text-slate-400">{formatDistance(distance)}</span>
          )}
        </div>
      </div>

      {/* 충전기 수 */}
      <div className="flex-shrink-0 text-center min-w-[72px]">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {isKo ? "충전기" : "Chargers"}
        </p>
        <p className="text-2xl font-bold text-teal-600 leading-none">
          {station.chargerCount}
        </p>
      </div>

      {/* View Details 버튼 */}
      <Link
        href={`/${locale}/facilities/ev-charging/${station.statId}`}
        className="flex-shrink-0 inline-flex items-center justify-center px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
      >
        {isKo ? "상세보기" : "View Details"}
      </Link>
    </div>
  );
}
