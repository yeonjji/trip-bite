"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { PlugZap, Zap, BatteryCharging, MapPin, ChevronDown } from "lucide-react";
import { AREA_CODES, AREA_CODE_MAP } from "@/lib/constants/area-codes";

interface EvChargingFiltersProps {
  locale: string;
}

const KIND_OPTIONS = [
  { value: "", labelKo: "전체", labelEn: "All Stations", icon: PlugZap },
  { value: "01", labelKo: "급속", labelEn: "Fast Charge", icon: Zap },
  { value: "02", labelKo: "완속", labelEn: "Slow Charge", icon: BatteryCharging },
];

export default function EvChargingFilters({ locale }: EvChargingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKo = locale === "ko";
  const [regionOpen, setRegionOpen] = useState(false);

  const zcode = searchParams.get("zcode") ?? "";
  const kind = searchParams.get("kind") ?? "";

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val) params.set(key, val);
        else params.delete(key);
      });
      params.delete("page");
      router.push(`/${locale}/facilities/ev-charging?${params.toString()}`);
    },
    [router, searchParams, locale]
  );

  const currentRegionName = zcode
    ? (isKo ? AREA_CODE_MAP[zcode]?.nameKo : AREA_CODE_MAP[zcode]?.nameEn) ?? (isKo ? "지역" : "Region")
    : isKo ? "지역" : "Region";

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">
          Navigation
        </p>
        <p className="text-xs font-bold text-slate-700 tracking-wide uppercase">
          EV Network
        </p>
      </div>

      {/* 충전 속도 탭 */}
      {KIND_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = kind === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => pushParams({ kind: opt.value })}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 text-left",
              isActive
                ? "bg-white text-orange-700 font-bold shadow-sm"
                : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0",
                isActive ? "text-orange-700" : "text-slate-400"
              )}
            />
            {isKo ? opt.labelKo : opt.labelEn}
          </button>
        );
      })}

      {/* 지역 탭 (hover 드롭다운) */}
      <div
        className="relative"
        onMouseEnter={() => setRegionOpen(true)}
        onMouseLeave={() => setRegionOpen(false)}
      >
        <button
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 text-left",
            zcode
              ? "bg-white text-orange-700 font-bold shadow-sm"
              : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
          )}
        >
          <MapPin
            className={cn(
              "w-4 h-4 shrink-0",
              zcode ? "text-orange-700" : "text-slate-400"
            )}
          />
          <span className="flex-1 truncate">{currentRegionName}</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 shrink-0 transition-transform",
              regionOpen && "rotate-180",
              zcode ? "text-orange-700" : "text-slate-400"
            )}
          />
        </button>

        {regionOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                pushParams({ zcode: "" });
                setRegionOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-4 py-2 text-xs transition-colors",
                !zcode
                  ? "text-orange-700 font-bold bg-orange-50"
                  : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
              )}
            >
              {isKo ? "전체 지역" : "All Regions"}
            </button>
            {AREA_CODES.map((area) => (
              <button
                key={area.code}
                onClick={() => {
                  pushParams({ zcode: area.code });
                  setRegionOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-4 py-2 text-xs transition-colors",
                  zcode === area.code
                    ? "text-orange-700 font-bold bg-orange-50"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
                )}
              >
                {isKo ? area.nameKo : area.nameEn}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
