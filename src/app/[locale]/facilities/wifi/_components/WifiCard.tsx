import Link from "next/link";
import { Wifi, MapPin, ChevronRight } from "lucide-react";
import type { FreeWifi } from "@/lib/data/free-wifi";

interface WifiCardProps {
  wifi: FreeWifi;
  locale: string;
}

export default function WifiCard({ wifi, locale }: WifiCardProps) {
  const isKo = locale === "ko";
  const address = wifi.address_road || wifi.address_jibun;
  const location = wifi.place_detail || address || [wifi.sido_name, wifi.sigungu_name].filter(Boolean).join(" ");

  return (
    <Link
      href={`/${locale}/facilities/wifi/${wifi.id}`}
      className="block bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
    >
    <div className="flex items-center justify-between gap-6">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-14 h-14 bg-[#F9F7F0] rounded-xl flex items-center justify-center text-primary">
        <Wifi className="w-7 h-7" />
      </div>

      {/* 중앙 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="font-semibold text-base text-gray-900 line-clamp-1">
            {wifi.place_name}
          </span>
          {wifi.facility_type && (
            <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded bg-orange-100 text-orange-700 tracking-tight uppercase">
              {wifi.facility_type}
            </span>
          )}
          {wifi.ssid && (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
              {wifi.ssid}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1 min-w-0 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-600" />
            {location}
          </span>
          {wifi.provider && (
            <span className="shrink-0 text-slate-400 text-xs">{wifi.provider}</span>
          )}
        </div>
      </div>

      {/* 무료 배지 */}
      <div className="flex-shrink-0 text-center min-w-[64px]">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {isKo ? "요금" : "Fee"}
        </p>
        <p className="text-base font-bold text-emerald-600 leading-none">
          {isKo ? "무료" : "Free"}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </div>
    </Link>
  );
}
