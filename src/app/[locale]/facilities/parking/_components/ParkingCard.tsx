import Link from "next/link";
import { ParkingCircle, MapPin, Clock, ChevronRight } from "lucide-react";
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
    <Link
      href={`/${locale}/facilities/parking/${lot.id}`}
      className="block bg-white rounded-xl p-4 md:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-3 md:gap-6">
        {/* 아이콘 */}
        <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 bg-[#F9F7F0] rounded-xl flex items-center justify-center text-primary">
          <ParkingCircle className="w-5 h-5 md:w-7 md:h-7" />
        </div>

        {/* 중앙 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-semibold text-sm md:text-base text-gray-900 line-clamp-1">
              {lot.name}
            </span>
            <span className={cn(
              "inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded tracking-tight uppercase",
              isFree ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            )}>
              {isKo ? (isFree ? "무료" : "유료") : (isFree ? "Free" : "Paid")}
            </span>
            {lot.type && (
              <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 tracking-tight uppercase">
                {lot.type}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-4">
            <span className="flex items-center gap-1 min-w-0 text-xs md:text-sm text-slate-500">
              <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-teal-600" />
              <span className="truncate">{address}</span>
            </span>
            {hasHours && (
              <span className="flex items-center gap-1 shrink-0 text-xs text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                {weekdayOpen}–{weekdayClose}
              </span>
            )}
          </div>
        </div>

        {/* 주차면 / 요금 */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <div className="text-center min-w-[40px] md:min-w-[64px]">
            {lot.capacity ? (
              <>
                <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {isKo ? "주차면" : "Spots"}
                </p>
                <p className="text-base md:text-2xl font-bold text-orange-600 leading-none">
                  {lot.capacity}
                </p>
              </>
            ) : lot.base_fee ? (
              <>
                <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {isKo ? "기본요금" : "Base Fee"}
                </p>
                <p className="text-xs md:text-sm font-bold text-orange-700 leading-none">
                  {isKo ? `${lot.base_fee.toLocaleString()}원` : `₩${lot.base_fee.toLocaleString()}`}
                </p>
              </>
            ) : null}
          </div>
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
