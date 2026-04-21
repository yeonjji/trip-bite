"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import RegionFilter from "@/components/filters/RegionFilter";

interface WifiFiltersProps {
  locale: string;
}

export default function WifiFilters({ locale }: WifiFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const zcode = searchParams.get("zcode") ?? "";

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

  return (
    <div className="flex flex-col gap-6">
      <RegionFilter value={zcode} onChange={(code) => pushParams({ zcode: code })} locale={locale} />
    </div>
  );
}
