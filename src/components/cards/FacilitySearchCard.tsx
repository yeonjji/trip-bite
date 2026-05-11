import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { FacilitySearchResult, FacilityType } from "@/lib/data/facility-search";

const TYPE_META: Record<FacilityType, { label: string; emoji: string; color: string }> = {
  parking: { label: "주차장",       emoji: "🅿️", color: "bg-[#F7F3ED] text-[#7A5C3A]" },
  wifi:    { label: "공공 와이파이", emoji: "📶", color: "bg-[#F0F7F4] text-[#2D6A4F]" },
  toilet:  { label: "공중화장실",   emoji: "🚻", color: "bg-[#F5F3F0] text-[#5A4A3A]" },
  ev:      { label: "전기차 충전소", emoji: "⚡", color: "bg-[#F0F0F7] text-[#3A3A6A]" },
};

interface Props {
  item: FacilitySearchResult;
  locale: string;
}

export default function FacilitySearchCard({ item, locale }: Props) {
  const meta = TYPE_META[item.type];
  const location = [item.sidoName, item.sigunguName].filter(Boolean).join(" ") || null;

  return (
    <Link href={`/${locale}${item.detailHref}`} className="group block">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-2xl ${meta.color}`}>
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
            {meta.label}
          </span>
          <h3 className="mt-0.5 line-clamp-1 text-[15px] font-bold leading-snug text-[#1B1C1A]">
            {item.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5">
            {location && (
              <span className="text-[11px] font-medium text-[#D84315]">{location}</span>
            )}
            {location && item.address && (
              <span className="text-[10px] text-muted-foreground">·</span>
            )}
            {item.address && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{item.address}</p>
            )}
          </div>
          {item.tip && (
            <p className="mt-1 text-[11px] text-[#9C8B84]">{item.tip}</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}
