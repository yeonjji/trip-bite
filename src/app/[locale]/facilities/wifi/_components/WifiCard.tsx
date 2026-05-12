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
      className="block bg-white rounded-xl p-4 md:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-3 md:gap-6">
        {/* 아이콘 */}
        <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 bg-[#F9F7F0] rounded-xl flex items-center justify-center text-primary">
          <Wifi className="w-5 h-5 md:w-7 md:h-7" />
        </div>

        {/* 중앙 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-semibold text-sm md:text-base text-gray-900 line-clamp-1">
              {wifi.place_name}
            </span>
            {wifi.facility_type && (
              <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 tracking-tight uppercase">
                {wifi.facility_type}
              </span>
            )}
            {wifi.ssid && (
              <span className="hidden md:inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                {wifi.ssid}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-4">
            <span className="flex items-center gap-1 min-w-0 text-xs md:text-sm text-slate-500">
              <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-teal-600" />
              <span className="truncate">{location}</span>
            </span>
            {wifi.provider && (
              <span className="shrink-0 text-slate-400 text-xs hidden md:block">{wifi.provider}</span>
            )}
          </div>
        </div>

        {/* 무료 배지 */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <div className="text-center min-w-[36px] md:min-w-[64px]">
            <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {isKo ? "요금" : "Fee"}
            </p>
            <p className="text-xs md:text-base font-bold text-emerald-600 leading-none">
              {isKo ? "무료" : "Free"}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
