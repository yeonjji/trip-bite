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
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white transition-all duration-150 hover:shadow-sm hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/[0.02] group">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#14b8a6]/10 flex items-center justify-center border-l-2 border-[#14b8a6]">
        <Wifi className="w-4.5 h-4.5 text-[#0d9488]" />
      </div>

      {/* 메인 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {wifi.facility_type && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#14b8a6]/10 text-[#0d9488]">
              {wifi.facility_type}
            </span>
          )}
          {wifi.ssid && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 font-mono">
              {wifi.ssid}
            </span>
          )}
        </div>
        <p className="font-semibold text-sm leading-snug line-clamp-1 text-gray-900 group-hover:text-[#0d9488] transition-colors">
          {wifi.place_name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {wifi.place_detail
            ? wifi.place_detail
            : address || [wifi.sido_name, wifi.sigungu_name].filter(Boolean).join(" ")}
        </p>
      </div>

      {/* 우측 보조 정보 */}
      <div className="flex-shrink-0 text-right">
        {wifi.provider && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[80px]">{wifi.provider}</p>
        )}
        {wifi.sigungu_name && (
          <p className="text-[11px] text-muted-foreground">{wifi.sigungu_name}</p>
        )}
      </div>
    </div>
  );
}
