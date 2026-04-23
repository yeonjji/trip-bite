"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Zap, MapPin, ChevronDown } from "lucide-react";
import { AREA_CODES, AREA_CODE_MAP } from "@/lib/constants/area-codes";

interface EvChargingFiltersProps {
  locale: string;
}

const KIND_OPTIONS = [
  { value: "", labelKo: "전체", labelEn: "All" },
  { value: "01", labelKo: "급속", labelEn: "Fast" },
  { value: "02", labelKo: "완속", labelEn: "Slow" },
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
      <div className="mb-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
          Navigation
        </p>
        <p className="text-xs font-bold text-foreground tracking-wide">
          EV NETWORK
        </p>
      </div>

      {KIND_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => pushParams({ kind: opt.value })}
          className={cn(
            "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
            kind === opt.value
              ? "bg-[#14b8a6]/10 text-[#0d9488] font-semibold"
              : "text-stone-600 hover:bg-stone-50"
          )}
        >
          <Zap
            className={cn(
              "w-4 h-4 shrink-0",
              kind === opt.value ? "text-[#0d9488]" : "text-stone-400"
            )}
          />
          {isKo ? opt.labelKo : opt.labelEn}
        </button>
      ))}

      <div
        className="relative"
        onMouseEnter={() => setRegionOpen(true)}
        onMouseLeave={() => setRegionOpen(false)}
      >
        <button
          className={cn(
            "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
            zcode
              ? "bg-[#14b8a6]/10 text-[#0d9488] font-semibold"
              : "text-stone-600 hover:bg-stone-50"
          )}
        >
          <MapPin
            className={cn(
              "w-4 h-4 shrink-0",
              zcode ? "text-[#0d9488]" : "text-stone-400"
            )}
          />
          <span className="flex-1 truncate">{currentRegionName}</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 shrink-0 transition-transform",
              regionOpen && "rotate-180",
              zcode ? "text-[#0d9488]" : "text-stone-400"
            )}
          />
        </button>

        {regionOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                pushParams({ zcode: "" });
                setRegionOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-3 py-1.5 text-xs transition-colors",
                !zcode
                  ? "text-[#0d9488] font-semibold bg-[#14b8a6]/5"
                  : "text-stone-600 hover:bg-stone-50"
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
                  "flex w-full items-center px-3 py-1.5 text-xs transition-colors",
                  zcode === area.code
                    ? "text-[#0d9488] font-semibold bg-[#14b8a6]/5"
                    : "text-stone-600 hover:bg-stone-50"
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
