import { Zap, ChevronRight } from "lucide-react";
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
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* 아이콘 영역 */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center border-l-4 border-[#14b8a6]">
        <Zap className="w-6 h-6 text-[#0d9488]" />
      </div>

      {/* 정보 영역 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          {/* 충전 속도 뱃지 */}
          <span className={cn(
            "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            isFast
              ? "bg-orange-100 text-orange-700"
              : "bg-blue-100 text-blue-700"
          )}>
            {isFast ? (isKo ? "급속" : "Fast") : (isKo ? "완속" : "Slow")}
          </span>
          {/* 충전기 타입 */}
          <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#0d9488]">
            {chargerTypeLabel}
          </span>
          {/* 주차 무료 */}
          {charger.parkingFree === "Y" && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
              {isKo ? "주차 무료" : "Free Parking"}
            </span>
          )}
          {/* 거리 */}
          {distance !== undefined && (
            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
              {formatDistance(distance)}
            </span>
          )}
        </div>

        {/* 충전소명 */}
        <h3 className="font-bold text-[15px] leading-snug line-clamp-1 text-gray-900">
          {charger.statNm}
        </h3>

        {/* 주소 */}
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {charger.addr}
        </p>

        {/* 운영기관 + 출력 */}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          {charger.busiNm && <span className="line-clamp-1">{charger.busiNm}</span>}
          {charger.output && (
            <>
              <span>·</span>
              <span className="font-medium text-[#0d9488]">{charger.output}kW</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 opacity-40" />
    </div>
  );
}
