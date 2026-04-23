"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MapPin, ChevronDown, Wifi, X } from "lucide-react";
import { AREA_CODES, AREA_CODE_MAP } from "@/lib/constants/area-codes";
import { createClient } from "@/lib/supabase/client";

interface WifiFiltersProps {
  locale: string;
}

export default function WifiFilters({ locale }: WifiFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKo = locale === "ko";

  const zcode = searchParams.get("zcode") ?? "";
  const sigungu = searchParams.get("sigungu") ?? "";

  const [regionOpen, setRegionOpen] = useState(false);
  const [sigunguOpen, setSigunguOpen] = useState(false);
  const [sigunguList, setSigunguList] = useState<string[]>([]);

  const regionRef = useRef<HTMLDivElement>(null);
  const sigunguRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!zcode) { setSigunguList([]); return; }
    const sb = createClient();
    sb.from("free_wifi")
      .select("sigungu_name")
      .eq("area_code", zcode)
      .not("sigungu_name", "is", null)
      .then(({ data }) => {
        const names = [...new Set((data ?? []).map((r: { sigungu_name: string }) => r.sigungu_name).filter(Boolean))].sort();
        setSigunguList(names as string[]);
      });
  }, [zcode]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false);
      if (sigunguRef.current && !sigunguRef.current.contains(e.target as Node)) setSigunguOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val) params.set(key, val);
        else params.delete(key);
      });
      params.delete("page");
      router.push(`/${locale}/facilities/wifi?${params.toString()}`);
    },
    [router, searchParams, locale]
  );

  const currentRegionName = zcode
    ? (isKo ? AREA_CODE_MAP[zcode]?.nameKo : AREA_CODE_MAP[zcode]?.nameEn) ?? ""
    : isKo ? "전체 지역" : "All Regions";

  const hasFilters = zcode || sigungu;

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Navigation</p>
        <p className="text-xs font-bold text-slate-700 tracking-wide uppercase">Public Wi-Fi</p>
      </div>

      <button
        onClick={() => pushParams({ zcode: "", sigungu: "" })}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium transition-all text-left",
          !zcode && !sigungu ? "bg-white text-orange-700 font-bold shadow-sm" : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
        )}
      >
        <Wifi className={cn("w-4 h-4 shrink-0", !zcode && !sigungu ? "text-orange-700" : "text-slate-400")} />
        {isKo ? "전체 보기" : "All Spots"}
      </button>

      <div className="border-t border-gray-100 my-2" />

      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-1">
        {isKo ? "지역" : "Region"}
      </p>
      <div className="relative" ref={regionRef}>
        <button
          onClick={() => setRegionOpen((v) => !v)}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium transition-all text-left",
            zcode ? "bg-white text-orange-700 font-bold shadow-sm" : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
          )}
        >
          <MapPin className={cn("w-4 h-4 shrink-0", zcode ? "text-orange-700" : "text-slate-400")} />
          <span className="flex-1 truncate">{currentRegionName}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", regionOpen && "rotate-180", zcode ? "text-orange-700" : "text-slate-400")} />
        </button>
        {regionOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
            <button
              onClick={() => { pushParams({ zcode: "", sigungu: "" }); setRegionOpen(false); }}
              className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors", !zcode ? "text-orange-700 font-bold bg-orange-50" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
            >
              {isKo ? "전체 지역" : "All Regions"}
            </button>
            {AREA_CODES.map((area) => (
              <button
                key={area.code}
                onClick={() => { pushParams({ zcode: area.code, sigungu: "" }); setRegionOpen(false); }}
                className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors", zcode === area.code ? "text-orange-700 font-bold bg-orange-50" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
              >
                {isKo ? area.nameKo : area.nameEn}
              </button>
            ))}
          </div>
        )}
      </div>

      {zcode && sigunguList.length > 0 && (
        <div className="relative" ref={sigunguRef}>
          <button
            onClick={() => setSigunguOpen((v) => !v)}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium transition-all text-left",
              sigungu ? "bg-white text-orange-700 font-bold shadow-sm" : "text-slate-500 hover:bg-orange-50 hover:text-orange-700"
            )}
          >
            <span className={cn("w-4 h-4 shrink-0 flex items-center justify-center text-[10px]", sigungu ? "text-orange-600" : "text-slate-300")}>▸</span>
            <span className="flex-1 truncate">{sigungu || (isKo ? "전체 시/군/구" : "All Districts")}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", sigunguOpen && "rotate-180", sigungu ? "text-orange-700" : "text-slate-400")} />
          </button>
          {sigunguOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 max-h-64 overflow-y-auto">
              <button
                onClick={() => { pushParams({ sigungu: "" }); setSigunguOpen(false); }}
                className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors", !sigungu ? "text-orange-700 font-bold bg-orange-50" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
              >
                {isKo ? "전체 시/군/구" : "All Districts"}
              </button>
              {sigunguList.map((name) => (
                <button
                  key={name}
                  onClick={() => { pushParams({ sigungu: name }); setSigunguOpen(false); }}
                  className={cn("flex w-full items-center px-4 py-2 text-xs transition-colors", sigungu === name ? "text-orange-700 font-bold bg-orange-50" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700")}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hasFilters && (
        <>
          <div className="border-t border-gray-100 my-2" />
          <button
            onClick={() => router.push(`/${locale}/facilities/wifi`)}
            className="flex items-center gap-2 w-full rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {isKo ? "필터 초기화" : "Reset filters"}
          </button>
        </>
      )}
    </div>
  );
}
