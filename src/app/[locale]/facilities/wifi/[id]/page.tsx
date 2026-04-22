import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Wifi, ArrowLeft, MapPin, Radio, Building2, Navigation, Map } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { cn } from "@/lib/utils";
import { getWifiById } from "@/lib/data/free-wifi";
import NaverMap from "@/components/maps/NaverMap";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-12">
      {/* 뒤로가기 */}
      <Link
        href={`/${locale}/facilities/wifi`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0d9488] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isKo ? "공공 와이파이" : "Public WiFi"}
      </Link>

      {/* 히어로 */}
      <div className="bg-gradient-to-br from-[#14b8a6] to-[#0d9488] rounded-2xl p-5 text-white mb-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Wifi className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-snug">{wifi.place_name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {wifi.facility_type && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {wifi.facility_type}
                </span>
              )}
              {wifi.provider && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {wifi.provider}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-px mt-5 bg-white/20 rounded-xl overflow-hidden">
          <div className="text-center py-3 bg-white/10">
            <p className="text-sm font-semibold truncate px-2">
              {wifi.facility_type || "-"}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {isKo ? "시설 유형" : "Facility Type"}
            </p>
          </div>
          <div className="text-center py-3 bg-white/10">
            <p className="text-sm font-semibold truncate px-2">
              {wifi.provider || "-"}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {isKo ? "제공사" : "Provider"}
            </p>
          </div>
        </div>
      </div>

      {/* 지도 */}
      {hasLocation && (
        <div className="rounded-2xl border border-border overflow-hidden mb-4 h-52 relative">
          <NaverMap
            lat={lat!}
            lng={lng!}
            zoom={16}
            showMarker
            className="h-full w-full relative"
          />
        </div>
      )}

      {/* 이용 정보 */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3">
          {isKo ? "이용 정보" : "Details"}
        </h2>
        <dl className="flex flex-col gap-3">
          {address && (
            <InfoRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label={isKo ? "주소" : "Address"}
              value={address}
            />
          )}
          {wifi.place_detail && (
            <InfoRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label={isKo ? "상세 위치" : "Location Detail"}
              value={wifi.place_detail}
            />
          )}
          {wifi.ssid && (
            <InfoRow
              icon={<Radio className="w-3.5 h-3.5" />}
              label="SSID"
              value={wifi.ssid}
            />
          )}
          {wifi.provider && (
            <InfoRow
              icon={<Building2 className="w-3.5 h-3.5" />}
              label={isKo ? "제공사" : "Provider"}
              value={wifi.provider}
            />
          )}
          {region && (
            <InfoRow
              icon={<Map className="w-3.5 h-3.5" />}
              label={isKo ? "지역" : "Region"}
              value={region}
            />
          )}
        </dl>
      </div>

      {/* 길찾기 버튼 */}
      {hasLocation && (
        <a
          href={`https://map.naver.com/v5/search/${encodeURIComponent(address || wifi.place_name)}`}
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
