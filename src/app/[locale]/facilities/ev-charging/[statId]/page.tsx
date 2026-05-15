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
  BatteryCharging,
  CheckCircle,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { cn } from "@/lib/utils";
import { getEvStation } from "@/lib/data/ev-charging";
import { getNearbyTourRecommendations, getNearbyFoodItems } from "@/lib/data/nearby-tour-recommendations";
import NaverMap from "@/components/maps/NaverMap";
import ShareButton from "@/components/shared/ShareButton";
import FacilityNearbySections from "@/components/nearby/FacilityNearbySection";
import { getNearbyShops } from "@/lib/data/nearby-shops";
import NearbyShopsTravelSection from "@/components/nearby/NearbyShopsTravelSection";

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

const STAT_INFO: Record<string, { label: string; labelEn: string; border: string; bg: string; badge: string }> = {
  "2": {
    label: "충전대기", labelEn: "AVAILABLE",
    border: "border-green-100", bg: "bg-green-50/30",
    badge: "text-green-700 bg-green-100",
  },
  "3": {
    label: "충전중", labelEn: "CHARGING",
    border: "border-blue-100", bg: "bg-blue-50/30",
    badge: "text-blue-700 bg-blue-100",
  },
  "1": {
    label: "통신이상", labelEn: "ERROR",
    border: "border-red-100", bg: "bg-red-50/20",
    badge: "text-red-700 bg-red-100",
  },
  "4": {
    label: "운영중지", labelEn: "STOPPED",
    border: "border-gray-100", bg: "bg-gray-50/30",
    badge: "text-gray-600 bg-gray-100",
  },
  "5": {
    label: "점검중", labelEn: "MAINTENANCE",
    border: "border-orange-100", bg: "bg-orange-50/20",
    badge: "text-orange-700 bg-orange-100",
  },
  "9": {
    label: "삭제", labelEn: "REMOVED",
    border: "border-gray-100", bg: "bg-gray-50/20",
    badge: "text-gray-400 bg-gray-50",
  },
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
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <dt className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </dt>
        <dd className="text-sm text-foreground leading-snug mt-0.5">{value}</dd>
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

  const { chargers, statusMap } = station!;
  const first = chargers[0];

  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lng);
  const hasLocation = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const tourTabOrder = ["accommodation", "travel", "festival"] as const;
  const [restaurantItems, cafeItems, tourRecs, nearbyShops] = hasLocation
    ? await Promise.all([
        getNearbyFoodItems({ lat, lng, type: "restaurant", limit: 8 }),
        getNearbyFoodItems({ lat, lng, type: "cafe", limit: 8 }),
        getNearbyTourRecommendations({ lat, lng, types: [...tourTabOrder], limitPerType: 6 }),
        getNearbyShops(lat, lng),
      ])
    : [[], [], { travel: [], festival: [], accommodation: [], restaurant: [], cafe: [] }, null];

  // output kW 기준으로 급속/완속 판단 (22kW 초과 = 급속)
  const hasFast = chargers.some((c) => parseFloat(c.output) > 22);
  const hasSlow = chargers.some((c) => {
    const kw = parseFloat(c.output);
    return !isNaN(kw) && kw > 0 && kw <= 22;
  });
  const maxOutput = Math.max(...chargers.map((c) => parseFloat(c.output) || 0));
  const isParkingFree = first.parkingFree === "Y";
  const availableCount = chargers.filter((c) => statusMap[c.chgerId]?.stat === "2").length;

  return (
    <div className="bg-[#F9F7F0] min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-16">

        {/* 뒤로가기 */}
        <Link
          href={`/${locale}/facilities/ev-charging`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-orange-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isKo ? "전기차 충전소" : "EV Charging"}
        </Link>

        {/* 히어로 배너 */}
        <div className="relative h-[180px] md:h-[280px] rounded-2xl overflow-hidden mb-4 md:mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700">
          {/* 배경 Zap 아이콘 */}
          <div className="absolute right-6 md:right-8 inset-y-0 flex items-center">
            <Zap className="w-20 h-20 md:w-48 md:h-48 text-white/[0.03] md:text-white/5" strokeWidth={1} />
          </div>
          {/* 왼쪽 하단 콘텐츠 */}
          <div className="absolute inset-0 flex flex-col justify-center md:justify-end p-4 md:p-8">
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-1.5 md:mb-3">
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full",
                availableCount > 0 ? "bg-green-500/90 text-white" : "bg-slate-600/80 text-slate-300"
              )}>
                {availableCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                {availableCount > 0
                  ? (isKo ? "이용가능" : "Available")
                  : (isKo ? "현황없음" : "No Status")}
              </span>
              {hasFast && (
                <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/80 text-white">
                  {isKo ? "급속" : "Fast"}
                </span>
              )}
              {hasSlow && (
                <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-slate-600/80 text-slate-200">
                  {isKo ? "완속" : "Slow"}
                </span>
              )}
              {isParkingFree && (
                <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/80 text-white">
                  {isKo ? "주차무료" : "Free Parking"}
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-white leading-snug">{first.statNm}</h1>
            {first.addr && (
              <p className="text-xs md:text-sm text-slate-300 mt-0.5 md:mt-1 line-clamp-1">{first.addr}</p>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            {
              icon: <Zap className="w-5 h-5" />,
              label: isKo ? "최대 속도" : "Max Speed",
              value: maxOutput > 0 ? `${maxOutput}kW` : "-",
            },
            {
              icon: <BatteryCharging className="w-5 h-5" />,
              label: isKo ? "총 충전기" : "Total Chargers",
              value: String(chargers.length),
            },
            {
              icon: <CheckCircle className="w-5 h-5" />,
              label: isKo ? "이용가능" : "Available",
              value: String(availableCount),
            },
            {
              icon: <Clock className="w-5 h-5" />,
              label: isKo ? "이용시간" : "Hours",
              value: first.useTime || (isKo ? "24시간" : "24 Hours"),
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-slate-800 truncate">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 2컬럼 메인 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 왼쪽: 충전기 현황 카드 목록 */}
          <div className="lg:col-span-2">
            <h2 className="text-base font-bold text-slate-800 mb-4">
              {isKo ? "충전기 현황" : "Charger Status"}
            </h2>
            <div className="flex flex-col gap-4">
              {chargers.map((charger) => {
                const st = statusMap[charger.chgerId];
                const statInfo = st ? (STAT_INFO[st.stat] ?? null) : null;
                const kwNum = parseFloat(charger.output) || 0;
                const isFastCharger = kwNum > 22;
                const updTime = st?.statUpdDt ? formatDateTime(st.statUpdDt) : null;

                return (
                  <div
                    key={charger.chgerId}
                    className={cn(
                      "bg-white rounded-2xl border p-6 shadow-sm",
                      statInfo?.border ?? "border-zinc-100",
                      statInfo?.bg ?? ""
                    )}
                  >
                    {/* 상단 */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                          isFastCharger ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {isFastCharger
                            ? <Zap className="w-6 h-6" />
                            : <BatteryCharging className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {isKo ? "충전기" : "Charger"} #{charger.chgerId}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {CHARGER_TYPE_LABELS[charger.chgerType] ?? charger.chgerType}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {statInfo ? (
                          <span className={cn(
                            "inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full",
                            statInfo.badge
                          )}>
                            {isKo ? statInfo.label : statInfo.labelEn}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-slate-400 px-3 py-1 rounded-full bg-slate-100">
                            {isKo ? "정보없음" : "Unknown"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 구분선 */}
                    <div className="border-t border-zinc-100 my-4" />

                    {/* 하단 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {charger.output && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                              {isKo ? "출력" : "Power"}
                            </p>
                            <p className="text-base font-bold text-orange-600">{charger.output}kW</p>
                          </div>
                        )}
                        {charger.method && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                              {isKo ? "방식" : "Method"}
                            </p>
                            <p className="text-sm font-medium text-slate-700">{charger.method}</p>
                          </div>
                        )}
                      </div>
                      {updTime && (
                        <p className="text-[10px] text-slate-400">
                          {isKo ? "갱신" : "Updated"}: {updTime}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 오른쪽: 이용정보 + 지도 + 길찾기 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 mb-4">
              <h2 className="text-base font-bold text-slate-800 mb-5">
                {isKo ? "이용 정보" : "Details"}
              </h2>
              <dl className="flex flex-col gap-4">
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label={isKo ? "주소" : "Address"}
                  value={first.addr}
                />
                {first.useTime && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label={isKo ? "이용시간" : "Hours"}
                    value={first.useTime}
                  />
                )}
                {first.busiNm && (
                  <InfoRow
                    icon={<Building2 className="w-4 h-4" />}
                    label={isKo ? "운영기관" : "Operator"}
                    value={first.busiNm}
                  />
                )}
                {first.busiCall && (
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label={isKo ? "연락처" : "Phone"}
                    value={first.busiCall}
                  />
                )}
                {first.limitYn === "Y" && first.limitDetail && (
                  <InfoRow
                    icon={<AlertCircle className="w-4 h-4" />}
                    label={isKo ? "이용제한" : "Restriction"}
                    value={first.limitDetail}
                  />
                )}
                {first.note && (
                  <InfoRow
                    icon={<Info className="w-4 h-4" />}
                    label={isKo ? "비고" : "Notes"}
                    value={first.note}
                  />
                )}
              </dl>
            </div>

            {/* 지도 */}
            {hasLocation && (
              <div className="h-48 rounded-xl overflow-hidden border border-zinc-200 mb-4 relative">
                <NaverMap lat={lat} lng={lng} zoom={16} showMarker className="h-full w-full relative" />
              </div>
            )}

            {/* 길찾기 버튼 */}
            {hasLocation && (
              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(first.addr)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
              >
                <Navigation className="w-4 h-4" />
                {isKo ? "네이버 지도에서 길찾기" : "Get Directions on Naver Maps"}
              </a>
            )}
            <div className="mt-3">
              <ShareButton
                title={first.statNm || (isKo ? "전기차 충전소" : "EV Charging Station")}
                isKo={isKo}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-[#5A413A] transition hover:border-[#D84315] hover:text-[#D84315]"
              />
            </div>
          </div>
        </div>

        {nearbyShops && <NearbyShopsTravelSection shops={nearbyShops} isKo={isKo} />}

        {hasLocation && (
          <FacilityNearbySections
            restaurants={restaurantItems}
            cafes={cafeItems}
            tourRecs={tourRecs}
            tourTabOrder={[...tourTabOrder]}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
