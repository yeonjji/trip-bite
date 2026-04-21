"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import RegionFilter from "@/components/filters/RegionFilter";

interface ToiletFiltersProps {
  locale: string;
}

const BABY_OPTIONS = [
  { value: "", labelKo: "전체", labelEn: "All" },
  { value: "Y", labelKo: "기저귀교환대 있음", labelEn: "Baby Care" },
];

export default function ToiletFilters({ locale }: ToiletFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKo = locale === "ko";

  const zcode = searchParams.get("zcode") ?? "";
  const babyCare = searchParams.get("baby_care") ?? "";

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val) params.set(key, val);
        else params.delete(key);
      });
      params.delete("page");
      router.push(`/${locale}/facilities/restrooms?${params.toString()}`);
    },
    [router, searchParams, locale]
  );

  return (
    <div className="flex flex-col gap-6">
      <RegionFilter value={zcode} onChange={(code) => pushParams({ zcode: code })} locale={locale} />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-foreground">
          {isKo ? "편의 시설" : "Amenities"}
        </span>
        <div className="flex gap-2">
          {BABY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => pushParams({ baby_care: opt.value })}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                babyCare === opt.value
                  ? "bg-[#14b8a6] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              {isKo ? opt.labelKo : opt.labelEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
