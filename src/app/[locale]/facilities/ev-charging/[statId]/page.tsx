import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Building2,
  Navigation,
  AlertCircle,
  Info,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { cn } from "@/lib/utils";
import { getEvStation } from "@/lib/data/ev-charging";
import NaverMap from "@/components/maps/NaverMap";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; statId: string }>;
}

const CHARGER_TYPE_LABELS: Record<string, string> = {
  "01": "DC차데모",
  "02": "AC완속",
  "03": "DC차데모+AC3상",
  "04": "DC콤보",
  "05": "DC차데모+DC콤보",
  "06": "DC차데모+AC3상+DC콤보",
  "07": "AC3상",
};

const STAT_INFO: Record<string, { label: string; dot: string; badge: string }> = {
  "2": { label: "충전대기", dot: "bg-green-500", badge: "text-green-700 bg-green-50" },
  "3": { label: "충전중",   dot: "bg-blue-500",  badge: "text-blue-700 bg-blue-50"  },
  "1": { label: "통신이상", dot: "bg-red-500",    badge: "text-red-700 bg-red-50"    },
  "4": { label: "운영중지", dot: "bg-gray-400",   badge: "text-gray-600 bg-gray-100" },
  "5": { label: "점검중",   dot: "bg-orange-400", badge: "text-orange-700 bg-orange-50" },
  "9": { label: "삭제",     dot: "bg-gray-300",   badge: "text-gray-400 bg-gray-50"  },
};

function formatDateTime(dt: string): string {
  if (!dt || dt.length < 12) return "";
  return `${dt.slice(0, 4)}.${dt.slice(4, 6)}.${dt.slice(6, 8)} ${dt.slice(8, 10)}:${dt.slice(10, 12)}`;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[#14b8a6]/10 flex items-center justify-center text-[#0d9488] mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <dt className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </dt>
        <dd className="text-sm text-foreground leading-snug">{value}</dd>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; statId: string }> }): Promise<Metadata> {
  const { locale, statId } = await params;
  const station = await getEvStation(statId);
  const name = station?.chargers[0]?.statNm ?? (locale === "ko" ? "전기차 충전소" : "EV Charging Station");
  return {
    title: name,
    description: station?.chargers[0]?.addr ?? "",
  };
}

export default async function EvChargingDetailPage({ params }: PageProps) {
  const { locale, statId } = await params;
  setRequestLocale(locale);
  const isKo = locale === "ko";

  const station = await getEvStation(statId);
  if (!station) notFound();

  // notFound() throws — station is EvStation here
  const { chargers, statusMap } = station!;
  const first = chargers[0];

  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lng);
  const hasLocation = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const hasFast = chargers.some((c) => c.kind === "01");
  const hasSlow = chargers.some((c) => c.kind === "02");
  const maxOutput = Math.max(...chargers.map((c) => parseFloat(c.output) || 0));
  const isParkingFree = first.parkingFree === "Y";
  const availableCount = chargers.filter((c) => statusMap[c.chgerId]?.stat === "2").length;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-12">
      {/* 뒤로가기 */}
      <Link
        href={`/${locale}/facilities/ev-charging`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0d9488] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isKo ? "전기차 충전소" : "EV Charging"}
      </Link>

      {/* 히어로 */}
      <div className="bg-gradient-to-br from-[#14b8a6] to-[#0d9488] rounded-2xl p-5 text-white mb-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-snug">{first.statNm}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span
                className={cn(
                  "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  availableCount > 0
                    ? "bg-green-400/30 text-white"
                    : "bg-white/20 text-white/80"
                )}
              >
                {availableCount > 0
                  ? isKo ? "이용가능" : "Available"
                  : isKo ? "대기없음" : "Unavailable"}
              </span>
              {hasFast && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-400/30 text-white">
                  {isKo ? "급속" : "Fast"}
                </span>
              )}
              {hasSlow && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {isKo ? "완속" : "Slow"}
                </span>
              )}
              {isParkingFree && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {isKo ? "주차무료" : "Free Parking"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px mt-5 bg-white/20 rounded-xl overflow-hidden">
          <div className="text-center py-3 bg-white/10">
            <p className="text-2xl font-bold">{chargers.length}</p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {isKo ? "충전기" : "Chargers"}
            </p>
          </div>
          <div className="text-center py-3 bg-white/10">
            <p className="text-2xl font-bold">
              {maxOutput > 0 ? maxOutput : "-"}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {isKo ? "최대 kW" : "Max kW"}
            </p>
          </div>
          <div className="text-center py-3 bg-white/10">
            <p className="text-2xl font-bold">{availableCount}</p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {isKo ? "대기가능" : "Available"}
            </p>
          </div>
        </div>
      </div>

      {/* 지도 */}
      {hasLocation && (
        <div className="rounded-2xl border border-border overflow-hidden mb-4 h-52 relative">
          <NaverMap lat={lat} lng={lng} zoom={16} showMarker className="h-full w-full relative" />
        </div>
      )}

      {/* 충전기 현황 */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3">
          {isKo ? "충전기 현황" : "Charger Status"}
        </h2>
        <div className="flex flex-col divide-y divide-border">
          {chargers.map((charger) => {
            const st = statusMap[charger.chgerId];
            const statInfo = st ? (STAT_INFO[st.stat] ?? null) : null;
            const isFastCharger = charger.kind === "01";
            const updTime = st?.statUpdDt ? formatDateTime(st.statUpdDt) : null;

            return (
              <div
                key={charger.chgerId}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                {/* 상태 dot */}
                <div
                  className={cn(
                    "flex-shrink-0 w-2 h-2 rounded-full",
                    statInfo?.dot ?? "bg-gray-300"
                  )}
                />

                {/* 충전기 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                        isFastCharger
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {isFastCharger
                        ? isKo ? "급속" : "Fast"
                        : isKo ? "완속" : "Slow"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{charger.chgerId} ·{" "}
                      {CHARGER_TYPE_LABELS[charger.chgerType] ?? charger.chgerType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {charger.output && (
                      <p className="text-sm font-semibold text-foreground">
                        {charger.output}kW
                      </p>
                    )}
                    {charger.method && (
                      <p className="text-xs text-muted-foreground">{charger.method}</p>
                    )}
                  </div>
                  {updTime && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {isKo ? "갱신" : "Updated"}: {updTime}
                    </p>
                  )}
                </div>

                {/* 상태 배지 */}
                <div className="flex-shrink-0">
                  {statInfo ? (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        statInfo.badge
                      )}
                    >
                      {statInfo.label}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 이용 정보 */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3">
          {isKo ? "이용 정보" : "Details"}
        </h2>
        <dl className="flex flex-col gap-3">
          <InfoRow
            icon={<MapPin className="w-3.5 h-3.5" />}
            label={isKo ? "주소" : "Address"}
            value={first.addr}
          />
          {first.useTime && (
            <InfoRow
              icon={<Clock className="w-3.5 h-3.5" />}
              label={isKo ? "이용시간" : "Hours"}
              value={first.useTime}
            />
          )}
          {first.busiNm && (
            <InfoRow
              icon={<Building2 className="w-3.5 h-3.5" />}
              label={isKo ? "운영기관" : "Operator"}
              value={first.busiNm}
            />
          )}
          {first.busiCall && (
            <InfoRow
              icon={<Phone className="w-3.5 h-3.5" />}
              label={isKo ? "연락처" : "Phone"}
              value={first.busiCall}
            />
          )}
          {first.limitYn === "Y" && first.limitDetail && (
            <InfoRow
              icon={<AlertCircle className="w-3.5 h-3.5" />}
              label={isKo ? "이용제한" : "Restriction"}
              value={first.limitDetail}
            />
          )}
          {first.note && (
            <InfoRow
              icon={<Info className="w-3.5 h-3.5" />}
              label={isKo ? "비고" : "Notes"}
              value={first.note}
            />
          )}
        </dl>
      </div>

      {/* 길찾기 버튼 */}
      {hasLocation && (
        <a
          href={`https://map.naver.com/v5/search/${encodeURIComponent(first.addr)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-sm transition-colors"
        >
          <Navigation className="w-4 h-4" />
          {isKo ? "네이버 지도에서 길찾기" : "Get Directions on Naver Maps"}
        </a>
      )}
    </div>
  );
}
