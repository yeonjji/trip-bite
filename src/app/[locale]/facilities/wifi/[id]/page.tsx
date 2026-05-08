import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Wifi,
  ArrowLeft,
  MapPin,
  Radio,
  Building2,
  Navigation,
  Map,
  Signal,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { getWifiById } from "@/lib/data/free-wifi";
import NaverMap from "@/components/maps/NaverMap";
import ShareButton from "@/components/shared/ShareButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
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
  const wifi = await getWifiById(id);
  return {
    title: wifi?.place_name ?? "공공 와이파이",
    description: wifi?.address_road ?? wifi?.address_jibun ?? "",
  };
}

export default async function WifiDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const isKo = locale === "ko";

  const wifi = await getWifiById(id);
  if (!wifi) notFound();

  const lat = wifi.lat ?? null;
  const lng = wifi.lng ?? null;
  const hasLocation = lat !== null && lng !== null && lat !== 0 && lng !== 0;
  const address = wifi.address_road || wifi.address_jibun || "";
  const region = [wifi.sigungu_name, wifi.sido_name].filter(Boolean).join(" ");

  return (
    <div className="bg-[#F9F7F0] min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-16">

        {/* 뒤로가기 */}
        <Link
          href={`/${locale}/facilities/wifi`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-orange-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isKo ? "공공 와이파이" : "Public WiFi"}
        </Link>

        {/* 히어로 배너 */}
        <div className="relative h-[280px] rounded-2xl overflow-hidden mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700">
          <div className="absolute right-8 inset-y-0 flex items-center">
            <Wifi className="w-48 h-48 text-white/5" strokeWidth={1} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex flex-wrap gap-2 mb-3">
              {wifi.facility_type && (
                <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/80 text-white">
                  {wifi.facility_type}
                </span>
              )}
              {wifi.provider && (
                <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-slate-600/80 text-slate-200">
                  {wifi.provider}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white leading-snug">{wifi.place_name}</h1>
            {address && (
              <p className="text-sm text-slate-300 mt-1">{address}</p>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Signal className="w-5 h-5" />,
              label: "SSID",
              value: wifi.ssid || "-",
            },
            {
              icon: <Building2 className="w-5 h-5" />,
              label: isKo ? "시설 유형" : "Facility Type",
              value: wifi.facility_type || "-",
            },
            {
              icon: <Radio className="w-5 h-5" />,
              label: isKo ? "제공사" : "Provider",
              value: wifi.provider || "-",
            },
            {
              icon: <Map className="w-5 h-5" />,
              label: isKo ? "지역" : "Region",
              value: region || "-",
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

          {/* 왼쪽: 네트워크 연결 정보 */}
          <div className="lg:col-span-2">
            <h2 className="text-base font-bold text-slate-800 mb-4">
              {isKo ? "네트워크 정보" : "Network Info"}
            </h2>

            {/* SSID 카드 */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 mb-4">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Signal className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                    {isKo ? "네트워크 이름" : "Network Name (SSID)"}
                  </p>
                  <p className="text-xl font-bold text-slate-800 font-mono tracking-wide">
                    {wifi.ssid || "-"}
                  </p>
                </div>
              </div>
              <div className="border-t border-zinc-100 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {isKo ? "제공사" : "Provider"}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{wifi.provider || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {isKo ? "시설 유형" : "Facility Type"}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{wifi.facility_type || "-"}</p>
                </div>
              </div>
            </div>

            {/* 설치 위치 상세 */}
            {wifi.place_detail && (
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                      {isKo ? "설치 위치 상세" : "Location Detail"}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{wifi.place_detail}</p>
                  </div>
                </div>
              </div>
            )}
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
                {wifi.place_detail && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label={isKo ? "상세 위치" : "Location Detail"}
                    value={wifi.place_detail}
                  />
                )}
                {wifi.provider && (
                  <InfoRow
                    icon={<Building2 className="w-4 h-4" />}
                    label={isKo ? "제공사" : "Provider"}
                    value={wifi.provider}
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
                href={`https://map.naver.com/v5/search/${encodeURIComponent(address || wifi.place_name)}`}
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
                title={wifi.place_name}
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
