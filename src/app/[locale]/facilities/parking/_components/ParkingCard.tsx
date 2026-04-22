import { ParkingCircle } from "lucide-react";
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
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white transition-all duration-150 hover:shadow-sm hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/[0.02] group">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#14b8a6]/10 flex items-center justify-center border-l-2 border-[#14b8a6]">
        <ParkingCircle className="w-4.5 h-4.5 text-[#0d9488]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn(
            "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
            isFree ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-600"
          )}>
            {isKo ? (isFree ? "무료" : "유료") : (isFree ? "Free" : "Paid")}
          </span>
          {lot.type && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#14b8a6]/10 text-[#0d9488]">
              {lot.type}
            </span>
          )}
          {lot.capacity && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500">
              {isKo ? `${lot.capacity}면` : `${lot.capacity} spots`}
            </span>
          )}
        </div>
        <p className="font-semibold text-sm leading-snug line-clamp-1 text-gray-900 group-hover:text-[#0d9488] transition-colors">
          {lot.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{address}</p>
      </div>

      <div className="flex-shrink-0 text-right">
        {lot.base_fee ? (
          <p className="text-sm font-semibold text-[#0d9488]">
            {isKo ? `${lot.base_fee.toLocaleString()}원` : `₩${lot.base_fee.toLocaleString()}`}
          </p>
        ) : (
          <p className="text-sm font-semibold text-green-600">{isKo ? "무료" : "Free"}</p>
        )}
        {hasHours && (
          <p className="text-[11px] text-muted-foreground">{weekdayOpen}–{weekdayClose}</p>
        )}
      </div>
    </div>
  );
}
