import { ParkingCircle, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParkingLot } from "@/lib/data/parking";

interface ParkingCardProps {
  lot: ParkingLot;
  locale: string;
}

function formatHhmm(hhmm: string | null): string {
  if (!hhmm || hhmm.length < 4) return hhmm ?? "";
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

export default function ParkingCard({ lot, locale }: ParkingCardProps) {
  const isKo = locale === "ko";
  const isFree = lot.fee_type === "무료";
  const address = lot.address_road || lot.address_jibun;
  const weekdayOpen = formatHhmm(lot.weekday_open);
  const weekdayClose = formatHhmm(lot.weekday_close);
  const hasHours = weekdayOpen && weekdayClose;

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-6">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-14 h-14 bg-[#F9F7F0] rounded-xl flex items-center justify-center text-primary">
        <ParkingCircle className="w-7 h-7" />
      </div>

      {/* 중앙 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="font-semibold text-base text-gray-900 line-clamp-1">
            {lot.name}
          </span>
          <span className={cn(
            "inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded tracking-tight uppercase",
            isFree ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          )}>
            {isKo ? (isFree ? "무료" : "유료") : (isFree ? "Free" : "Paid")}
          </span>
          {lot.type && (
            <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded bg-orange-100 text-orange-700 tracking-tight uppercase">
              {lot.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1 min-w-0 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-600" />
            {address}
          </span>
          {hasHours && (
            <span className="flex items-center gap-1 shrink-0 text-xs">
              <Clock className="w-3 h-3 text-slate-400" />
              {weekdayOpen}–{weekdayClose}
            </span>
          )}
        </div>
      </div>

      {/* 주차면 / 요금 */}
      <div className="flex-shrink-0 text-center min-w-[72px]">
        {lot.capacity ? (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {isKo ? "주차면" : "Spots"}
            </p>
            <p className="text-2xl font-bold text-teal-600 leading-none">
              {lot.capacity}
            </p>
          </>
        ) : lot.base_fee ? (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {isKo ? "기본요금" : "Base Fee"}
            </p>
            <p className="text-sm font-bold text-orange-700 leading-none">
              {isKo ? `${lot.base_fee.toLocaleString()}원` : `₩${lot.base_fee.toLocaleString()}`}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
