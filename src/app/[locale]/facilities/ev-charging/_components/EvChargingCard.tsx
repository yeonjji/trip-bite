import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils/haversine";
import type { EvCharger } from "@/lib/data/ev-charging";

const CHARGER_TYPE_LABELS: Record<string, string> = {
  "01": "DC차데모",
  "02": "AC완속",
  "03": "DC차데모+AC3상",
  "04": "DC콤보",
  "05": "DC차데모+DC콤보",
  "06": "DC차데모+AC3상+DC콤보",
  "07": "AC3상",
};

interface EvChargingCardProps {
  charger: EvCharger;
  locale: string;
  distance?: number;
}

export default function EvChargingCard({ charger, locale, distance }: EvChargingCardProps) {
  const isKo = locale === "ko";
  const isFast = charger.kind === "01";
  const chargerTypeLabel = CHARGER_TYPE_LABELS[charger.chgerType] ?? charger.chgerType;

  return (
    <Link href={`/${locale}/facilities/ev-charging/${charger.statId}`} className="block">
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white transition-all duration-150 hover:shadow-sm hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/[0.02] group">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#14b8a6]/10 flex items-center justify-center border-l-2 border-[#14b8a6]">
        <Zap className="w-4.5 h-4.5 text-[#0d9488]" />
      </div>

      {/* 메인 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn(
            "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
            isFast ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
          )}>
            {isFast ? (isKo ? "급속" : "Fast") : (isKo ? "완속" : "Slow")}
          </span>
          <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500">
            {chargerTypeLabel}
          </span>
          {charger.parkingFree === "Y" && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-green-100 text-green-700">
              {isKo ? "주차무료" : "Free Parking"}
            </span>
          )}
        </div>
        <p className="font-semibold text-sm leading-snug line-clamp-1 text-gray-900 group-hover:text-[#0d9488] transition-colors">
          {charger.statNm}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{charger.addr}</p>
      </div>

      {/* 우측 보조 정보 */}
      <div className="flex-shrink-0 text-right">
        {charger.output && (
          <p className="text-sm font-semibold text-[#0d9488]">{charger.output}kW</p>
        )}
        {distance !== undefined ? (
          <p className="text-[11px] text-muted-foreground">{formatDistance(distance)}</p>
        ) : charger.busiNm ? (
          <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[80px]">{charger.busiNm}</p>
        ) : null}
      </div>
    </div>
    </Link>
  );
}
