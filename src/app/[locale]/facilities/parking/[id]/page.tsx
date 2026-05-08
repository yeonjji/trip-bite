import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ParkingCircle,
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Navigation,
  Car,
  BadgeDollarSign,
  Accessibility,
  Map,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { cn } from "@/lib/utils";
import { getParkingById } from "@/lib/data/parking";
import NaverMap from "@/components/maps/NaverMap";
import ShareButton from "@/components/shared/ShareButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function formatHhmm(hhmm: string | null): string {
  if (!hhmm || hhmm.length < 4) return hhmm ?? "";
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lot = await getParkingById(id);
  return {
    title: lot?.name ?? "주차장",
    description: lot?.address_road ?? lot?.address_jibun ?? "",
  };
}

export default async function ParkingDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const isKo = locale === "ko";

  const lot = await getParkingById(id);
  if (!lot) notFound();

  const lat = lot.lat ?? null;
  const lng = lot.lng ?? null;
  const hasLocation = lat !== null && lng !== null && lat !== 0 && lng !== 0;
  const address = lot.address_road || lot.address_jibun || "";
  const isFree = lot.fee_type === "무료";

  const weekdayOpen = formatHhmm(lot.weekday_open);
  const weekdayClose = formatHhmm(lot.weekday_close);
  const satOpen = formatHhmm(lot.sat_open);
  const satClose = formatHhmm(lot.sat_close);
  const holidayOpen = formatHhmm(lot.holiday_open);
  const holidayClose = formatHhmm(lot.holiday_close);

  const weekdayHours = weekdayOpen && weekdayClose ? `${weekdayOpen} – ${weekdayClose}` : (isKo ? "정보없음" : "N/A");
  const region = [lot.sigungu_name, lot.sido_name].filter(Boolean).join(" ");

  const operatingHours = [
    { label: isKo ? "평일" : "Weekday", value: weekdayOpen && weekdayClose ? `${weekdayOpen} – ${weekdayClose}` : null },
    { label: isKo ? "토요일" : "Saturday", value: satOpen && satClose ? `${satOpen} – ${satClose}` : null },
    { label: isKo ? "공휴일" : "Holiday", value: holidayOpen && holidayClose ? `${holidayOpen} – ${holidayClose}` : null },
  ];

  return (
    <div className="bg-[#F9F7F0] min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-16">

        {/* 뒤로가기 */}
        <Link
          href={`/${locale}/facilities/parking`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-orange-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isKo ? "주차장" : "Parking Lots"}
        </Link>

        {/* 히어로 배너 */}
        <div className="relative h-[280px] rounded-2xl overflow-hidden mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700">
          <div className="absolute right-8 inset-y-0 flex items-center">
            <ParkingCircle className="w-48 h-48 text-white/5" strokeWidth={1} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={cn(
                "inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full",
                isFree ? "bg-green-500/90 text-white" : "bg-slate-600/80 text-slate-200"
              )}>
                {isKo ? (isFree ? "무료" : "유료") : (isFree ? "Free" : "Paid")}
              </span>
              {lot.type && (
                <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/80 text-white">
                  {lot.type}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white leading-snug">{lot.name}</h1>
            {address && (
              <p className="text-sm text-slate-300 mt-1">{address}</p>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Car className="w-5 h-5" />,
              label: isKo ? "총 주차면" : "Total Spots",
              value: lot.capacity ? lot.capacity.toLocaleString() : "-",
            },
            {
              icon: <BadgeDollarSign className="w-5 h-5" />,
              label: isKo ? "요금" : "Fee",
              value: isFree
                ? (isKo ? "무료" : "Free")
                : lot.base_fee
                  ? (isKo ? `${lot.base_fee.toLocaleString()}원` : `₩${lot.base_fee.toLocaleString()}`)
                  : (isKo ? "유료" : "Paid"),
            },
            {
              icon: <Clock className="w-5 h-5" />,
              label: isKo ? "평일 운영" : "Weekday Hours",
              value: weekdayHours,
            },
            {
              icon: <Accessibility className="w-5 h-5" />,
              label: isKo ? "장애인 구역" : "Accessible",
              value: lot.disabled_spots ? String(lot.disabled_spots) : "-",
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-bold text-slate-800 truncate">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 2컬럼 메인 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 왼쪽: 운영시간 + 요금/규모 정보 */}
          <div className="lg:col-span-2">

            {/* 운영시간 카드 */}
            <h2 className="text-base font-bold text-slate-800 mb-4">
              {isKo ? "운영시간" : "Operating Hours"}
            </h2>
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 mb-6">
              <div className="flex flex-col divide-y divide-zinc-100">
                {operatingHours.map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{row.label}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-mono",
                      row.value ? "text-slate-800 font-semibold" : "text-slate-400"
                    )}>
                      {row.value ?? (isKo ? "정보없음" : "N/A")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 주차장 규모 카드 */}
            <h2 className="text-base font-bold text-slate-800 mb-4">
              {isKo ? "주차장 현황" : "Parking Details"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* 총 주차면 */}
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 mx-auto mb-3 flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
                <p className={cn(
                  "text-3xl font-bold",
                  lot.capacity ? "text-orange-600" : "text-slate-300"
                )}>
                  {lot.capacity?.toLocaleString() ?? "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1">{isKo ? "총 주차면" : "Total Spots"}</p>
              </div>

              {/* 장애인 구역 */}
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mx-auto mb-3 flex items-center justify-center">
                  <Accessibility className="w-6 h-6" />
                </div>
                <p className={cn(
                  "text-3xl font-bold",
                  lot.disabled_spots ? "text-blue-600" : "text-slate-300"
                )}>
                  {lot.disabled_spots ?? "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1">{isKo ? "장애인 구역" : "Accessible Spots"}</p>
              </div>

              {/* 요금 유형 */}
              <div className={cn(
                "bg-white rounded-2xl border shadow-sm p-6 text-center",
                isFree ? "border-green-100" : "border-zinc-100"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center",
                  isFree ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-500"
                )}>
                  <BadgeDollarSign className="w-6 h-6" />
                </div>
                <p className={cn(
                  "text-lg font-bold",
                  isFree ? "text-green-600" : "text-slate-700"
                )}>
                  {isKo ? (isFree ? "무료" : "유료") : (isFree ? "Free" : "Paid")}
                </p>
                <p className="text-xs text-slate-500 mt-1">{isKo ? "요금 유형" : "Fee Type"}</p>
              </div>

              {/* 기본요금 */}
              {!isFree && (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 mx-auto mb-3 flex items-center justify-center">
                    <BadgeDollarSign className="w-6 h-6" />
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    {lot.base_fee
                      ? (isKo ? `${lot.base_fee.toLocaleString()}원` : `₩${lot.base_fee.toLocaleString()}`)
                      : "-"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{isKo ? "기본요금" : "Base Fee"}</p>
                </div>
              )}
              {isFree && lot.type && (
                <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 mx-auto mb-3 flex items-center justify-center">
                    <ParkingCircle className="w-6 h-6" />
                  </div>
                  <p className="text-lg font-bold text-orange-600">{lot.type}</p>
                  <p className="text-xs text-slate-500 mt-1">{isKo ? "주차장 구분" : "Type"}</p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 이용정보 + 지도 + 길찾기 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 mb-4">
              <h2 className="text-base font-bold text-slate-800 mb-5">
                {isKo ? "이용 정보" : "Details"}
              </h2>
              <dl className="flex flex-col gap-4">
                {address && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label={isKo ? "주소" : "Address"}
                    value={address}
                  />
                )}
                {weekdayOpen && weekdayClose && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label={isKo ? "평일 운영시간" : "Weekday Hours"}
                    value={`${weekdayOpen} – ${weekdayClose}`}
                  />
                )}
                {lot.phone && (
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label={isKo ? "연락처" : "Phone"}
                    value={lot.phone}
                  />
                )}
                {region && (
                  <InfoRow
                    icon={<Map className="w-4 h-4" />}
                    label={isKo ? "지역" : "Region"}
                    value={region}
                  />
                )}
              </dl>
            </div>

            {hasLocation && (
              <div className="h-48 rounded-xl overflow-hidden border border-zinc-200 mb-4 relative">
                <NaverMap lat={lat!} lng={lng!} zoom={16} showMarker className="h-full w-full relative" />
              </div>
            )}

            {hasLocation && (
              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(address || lot.name)}`}
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
                title={lot.name}
                isKo={isKo}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-[#5A413A] transition hover:border-[#D84315] hover:text-[#D84315]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
