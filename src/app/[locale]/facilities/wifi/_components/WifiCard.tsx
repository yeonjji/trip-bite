import { Wifi } from "lucide-react";
import type { FreeWifi } from "@/lib/data/free-wifi";

interface WifiCardProps {
  wifi: FreeWifi;
  locale: string;
}

export default function WifiCard({ wifi, locale }: WifiCardProps) {
  const isKo = locale === "ko";
  const address = wifi.address_road || wifi.address_jibun;

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center border-l-4 border-[#14b8a6]">
        <Wifi className="w-6 h-6 text-[#0d9488]" />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          {wifi.facility_type && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#0d9488]">
              {wifi.facility_type}
            </span>
          )}
          {wifi.ssid && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono">
              {wifi.ssid}
            </span>
          )}
        </div>

        {/* 설치장소명 */}
        <h3 className="font-bold text-[15px] leading-snug line-clamp-1 text-gray-900">
          {wifi.place_name}
        </h3>

        {/* 상세 장소 */}
        {wifi.place_detail && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{wifi.place_detail}</p>
        )}

        {/* 주소 or 시군구 */}
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {address || [wifi.sido_name, wifi.sigungu_name].filter(Boolean).join(" ")}
        </p>

        {/* 제공사 */}
        {wifi.provider && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {isKo ? `제공: ${wifi.provider}` : `By ${wifi.provider}`}
          </p>
        )}
      </div>
    </div>
  );
}
