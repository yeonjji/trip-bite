import { ParkingCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParkingLot } from "@/lib/data/parking";

interface ParkingCardProps {
  lot: ParkingLot;
  locale: string;
}

function formatHhmm(hhmm: string): string {
  if (!hhmm || hhmm.length < 4) return hhmm;
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

export default function ParkingCard({ lot, locale }: ParkingCardProps) {
  const isKo = locale === "ko";
  const isFree = lot.smprcSe === "무료";
  const address = lot.rdnmadr || lot.adres;
  const hasFee = lot.bsrtfee && lot.bsrtfee !== "0";
  const weekdayOpen = formatHhmm(lot.weekdayOperOpenHhmm);
  const weekdayClose = formatHhmm(lot.weekdayOperColseHhmm);
  const hasHours = weekdayOpen && weekdayClose;

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center border-l-4 border-[#14b8a6]">
        <ParkingCircle className="w-6 h-6 text-[#0d9488]" />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          {/* 무료/유료 뱃지 */}
          <span className={cn(
            "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            isFree
              ? "bg-green-100 text-green-700"
              : "bg-stone-100 text-stone-600"
          )}>
            {isKo ? (isFree ? "무료" : "유료") : (isFree ? "Free" : "Paid")}
          </span>
          {/* 주차장 구분 */}
          {lot.prkplceSe && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#0d9488]">
              {lot.prkplceSe}
            </span>
          )}
          {/* 총 주차면수 */}
          {lot.prkcpa && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
              {isKo ? `${lot.prkcpa}면` : `${lot.prkcpa} spots`}
            </span>
          )}
        </div>

        {/* 주차장명 */}
        <h3 className="font-bold text-[15px] leading-snug line-clamp-1 text-gray-900">
          {lot.prkplceNm}
        </h3>

        {/* 주소 */}
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{address}</p>

        {/* 요금 + 운영시간 */}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
          {hasFee && (
            <span className="font-medium text-[#0d9488]">
              {isKo ? `기본 ${Number(lot.bsrtfee).toLocaleString()}원` : `₩${Number(lot.bsrtfee).toLocaleString()}`}
            </span>
          )}
          {hasHours && (
            <>
              {hasFee && <span>·</span>}
              <span>{weekdayOpen} – {weekdayClose}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
